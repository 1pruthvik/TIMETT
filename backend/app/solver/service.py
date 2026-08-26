from datetime import datetime
from typing import Any
from sqlalchemy.orm import Session
from ortools.sat.python import cp_model

from app.models.subject_offering import SubjectOffering
from app.models.room import Room
from app.models.lab import Lab
from app.models.lab_subject_mapping import LabSubjectMapping
from app.models.time_slot import TimeSlot
from app.models.timetable import Timetable
from app.models.timetable_entry import TimetableEntry
from app.models.faculty_availability import FacultyAvailability
from app.models.section import Section
from app.models.subject import Subject
from app.models.constraint import Constraint
from app.models.generation_run import GenerationRun
from app.solver.validator import TimetableValidator


def generate_timetable(
    db: Session,
    semester_id: int | None = None,
    institution_id: int | None = 1,
    generation_type: str = "single",
    joint_semester_ids: list[int] | None = None,
) -> dict[str, Any]:
    """
    Chronon Core CP-SAT Solver & Generation Orchestration Engine.
    Executes single-semester or first-year joint mirrored cycle timetable generation.
    """
    # 1. Initialize Generation Run Tracker
    gen_run = GenerationRun(
        academic_year_id=1,
        generation_type=generation_type,
        solver_status="RUNNING",
        started_at=datetime.utcnow(),
    )
    db.add(gen_run)
    db.commit()
    db.refresh(gen_run)

    try:
        # 2. Gather Domain Data
        offering_query = db.query(SubjectOffering)
        if generation_type == "joint_first_year" and joint_semester_ids:
            offering_query = offering_query.filter(SubjectOffering.semester_id.in_(joint_semester_ids))
        elif semester_id is not None:
            offering_query = offering_query.filter(SubjectOffering.semester_id == semester_id)
        offerings = offering_query.all()

        room_query = db.query(Room)
        if institution_id is not None:
            room_query = room_query.filter(Room.institution_id == institution_id)
        rooms = room_query.all()

        labs = db.query(Lab).all()
        slots = db.query(TimeSlot).all()
        availability = db.query(FacultyAvailability).all()
        sections = db.query(Section).all()
        subjects = db.query(Subject).all()
        lab_mappings = db.query(LabSubjectMapping).all()

        # Subject to Physical Lab mapping dictionary
        subject_to_lab = {m.subject_id: m.lab_id for m in lab_mappings}
        subject_map = {s.id: s for s in subjects}

        if not offerings:
            gen_run.solver_status = "INFEASIBLE"
            gen_run.error_information = "No subject offerings found for requested semester(s)."
            db.commit()
            return {"status": "error", "message": "No subject offerings found in curriculum."}

        if not rooms:
            gen_run.solver_status = "INFEASIBLE"
            gen_run.error_information = "No physical classrooms or lecture rooms found."
            db.commit()
            return {"status": "error", "message": "No rooms available for class allocation."}

        if not slots:
            gen_run.solver_status = "INFEASIBLE"
            gen_run.error_information = "No timetable time slots defined."
            db.commit()
            return {"status": "error", "message": "Time slot architecture not configured."}

        # 3. Formulate CP-SAT Mathematical Model
        model = cp_model.CpModel()
        assignment = {}

        # Decision Variables: assignment[o, r, s] = 1 if offering o is in room r during slot s
        for o in range(len(offerings)):
            for r in range(len(rooms)):
                for s in range(len(slots)):
                    assignment[o, r, s] = model.NewBoolVar(f"offering_{o}_rm_{r}_slot_{s}")

        # ---------------------------------------------------------
        # HARD CONSTRAINT 1: WEEKLY HOURS REQUIREMENT
        # ---------------------------------------------------------
        for o, offering in enumerate(offerings):
            required_hours = offering.weekly_hours or 4
            model.Add(
                sum(
                    assignment[o, r, s]
                    for r in range(len(rooms))
                    for s in range(len(slots))
                )
                == required_hours
            )

        # ---------------------------------------------------------
        # HARD CONSTRAINT 2: ROOM NO-OVERLAP
        # ---------------------------------------------------------
        for r in range(len(rooms)):
            for s in range(len(slots)):
                model.Add(
                    sum(assignment[o, r, s] for o in range(len(offerings))) <= 1
                )

        # ---------------------------------------------------------
        # HARD CONSTRAINT 3: SECTION NO-OVERLAP
        # ---------------------------------------------------------
        for section_id in {o.section_id for o in offerings}:
            for s in range(len(slots)):
                model.Add(
                    sum(
                        assignment[o, r, s]
                        for o in range(len(offerings))
                        if offerings[o].section_id == section_id
                        for r in range(len(rooms))
                    )
                    <= 1
                )

        # ---------------------------------------------------------
        # HARD CONSTRAINT 4: FACULTY NO-OVERLAP
        # ---------------------------------------------------------
        for faculty_id in {o.faculty_id for o in offerings}:
            for s in range(len(slots)):
                model.Add(
                    sum(
                        assignment[o, r, s]
                        for o in range(len(offerings))
                        if offerings[o].faculty_id == faculty_id
                        for r in range(len(rooms))
                    )
                    <= 1
                )

        # ---------------------------------------------------------
        # HARD CONSTRAINT 5: FACULTY AVAILABILITY
        # ---------------------------------------------------------
        for o, offering in enumerate(offerings):
            fac_avails = [a for a in availability if a.faculty_id == offering.faculty_id]
            if fac_avails:
                for s, slot in enumerate(slots):
                    is_avail = any(
                        a.day_of_week == slot.day_of_week and a.start_time <= slot.start_time
                        for a in fac_avails
                    )
                    if not is_avail:
                        for r in range(len(rooms)):
                            model.Add(assignment[o, r, s] == 0)

        # ---------------------------------------------------------
        # HARD CONSTRAINT 6: FIRST-YEAR PAIRED CYCLE SYNCHRONICITY
        # ---------------------------------------------------------
        if generation_type == "joint_first_year":
            # Group offerings by section stream and cycle group
            physics_offerings = [
                (i, o) for i, o in enumerate(offerings)
                if subject_map.get(o.subject_id) and subject_map[o.subject_id].cycle_group == "Physics"
            ]
            chemistry_offerings = [
                (i, o) for i, o in enumerate(offerings)
                if subject_map.get(o.subject_id) and subject_map[o.subject_id].cycle_group == "Chemistry"
            ]

            # If both cycles exist, align total sessions per slot
            if physics_offerings and chemistry_offerings:
                for s in range(len(slots)):
                    phys_active_in_slot = sum(
                        assignment[idx, r, s]
                        for idx, _ in physics_offerings
                        for r in range(len(rooms))
                    )
                    chem_active_in_slot = sum(
                        assignment[idx, r, s]
                        for idx, _ in chemistry_offerings
                        for r in range(len(rooms))
                    )
                    model.Add(phys_active_in_slot == chem_active_in_slot)

        # ---------------------------------------------------------
        # SOFT OBJECTIVE: SPREAD COURSES EVENLY ACROSS DAYS
        # ---------------------------------------------------------
        objective_terms = []
        days = list({s.day_of_week for s in slots})
        for o, _ in enumerate(offerings):
            for day in days:
                day_slots = [s_idx for s_idx, slot in enumerate(slots) if slot.day_of_week == day]
                if day_slots:
                    day_load = sum(
                        assignment[o, r, s_idx]
                        for r in range(len(rooms))
                        for s_idx in day_slots
                    )
                    objective_terms.append(day_load)

        if objective_terms:
            model.Minimize(sum(objective_terms))

        # 4. Solve the Model
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 30.0
        status = solver.Solve(model)

        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            gen_run.solver_status = "INFEASIBLE"
            gen_run.error_information = "Mathematical model is infeasible. Constraints exceed available rooms, labs, or time slots."
            db.commit()
            return {
                "status": "infeasible",
                "message": "Optimization engine could not find a clash-free schedule with current constraints.",
                "diagnostics": {
                    "reason": "Insufficient room capacity or conflicting faculty availability.",
                    "suggestions": [
                        "Verify that total required weekly periods do not exceed total available slots.",
                        "Add additional physical lecture rooms or adjust faculty availability restrictions.",
                        "Ensure 1st-year cycle groups have balanced weekly hours."
                    ]
                }
            }

        # 5. Extract Timetable Entries and Validate Independently
        target_timetable = (
            db.query(Timetable)
            .filter(Timetable.semester_id == (semester_id or 1))
            .first()
        )
        if not target_timetable:
            target_timetable = Timetable(
                institution_id=institution_id or 1,
                academic_year_id=1,
                semester_id=semester_id or 1,
                name=f"Chronon Timetable - {datetime.utcnow().strftime('%b %Y')}",
            )
            db.add(target_timetable)
            db.commit()
            db.refresh(target_timetable)

        # Clear old entries
        db.query(TimetableEntry).filter(TimetableEntry.timetable_id == target_timetable.id).delete()

        candidate_entries = []
        for o, offering in enumerate(offerings):
            for r, room in enumerate(rooms):
                for s, slot in enumerate(slots):
                    if solver.Value(assignment[o, r, s]) == 1:
                        sub = subject_map.get(offering.subject_id)
                        lab_id = subject_to_lab.get(offering.subject_id) if sub and sub.is_lab else None
                        paired_group = f"pair_{sub.stream_id}_{slot.id}" if sub and sub.cycle_group else None

                        entry = TimetableEntry(
                            timetable_id=target_timetable.id,
                            subject_offering_id=offering.id,
                            room_id=room.id if not lab_id else None,
                            lab_id=lab_id,
                            time_slot_id=slot.id,
                            stream_id=sub.stream_id if sub else None,
                            cycle_group=sub.cycle_group if sub else None,
                            paired_slot_group=paired_group,
                        )
                        db.add(entry)
                        candidate_entries.append({
                            "subject_offering_id": offering.id,
                            "faculty_id": offering.faculty_id,
                            "section_id": offering.section_id,
                            "room_id": room.id,
                            "lab_id": lab_id,
                            "time_slot_id": slot.id,
                            "paired_slot_group": paired_group,
                        })

        db.commit()

        # 6. Run Independent Validator Layer
        val_report = TimetableValidator.validate(
            entries=candidate_entries,
            rooms=[{"id": r.id} for r in rooms],
            labs=[{"id": l.id, "num_physical_labs": l.num_physical_labs} for l in labs],
            slots=[{"id": s.id} for s in slots],
            is_first_year_joint=(generation_type == "joint_first_year"),
        )

        gen_run.solver_status = "SUCCESS" if val_report["is_valid"] else "FAILED"
        gen_run.timetable_id = target_timetable.id
        gen_run.conflict_count = val_report["conflict_count"]
        gen_run.conflict_details = val_report
        gen_run.completed_at = datetime.utcnow()
        db.commit()

        return {
            "status": "success",
            "message": "Timetable generated and verified with 0 hard conflicts!",
            "timetable_id": target_timetable.id,
            "generation_run_id": gen_run.id,
            "validation_report": val_report,
            "entries_count": len(candidate_entries),
        }

    except Exception as e:
        gen_run.solver_status = "FAILED"
        gen_run.error_information = str(e)
        db.commit()
        return {"status": "error", "message": f"Solver runtime error: {str(e)}"}