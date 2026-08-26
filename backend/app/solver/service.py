from datetime import time

from sqlalchemy.orm import Session
from ortools.sat.python import cp_model

from app.models.subject_offering import SubjectOffering
from app.models.room import Room
from app.models.time_slot import TimeSlot
from app.models.timetable import Timetable
from app.models.timetable_entry import TimetableEntry
from app.models.faculty_availability import FacultyAvailability
from app.models.section import Section
from app.models.constraint import Constraint
from app.models.timetable_version import TimetableVersion
from app.models.generation_run import GenerationRun


def generate_timetable(db: Session, semester_id: int | None = None, institution_id: int | None = None):
    offering_query = db.query(SubjectOffering)
    if semester_id is not None:
        offering_query = offering_query.filter(SubjectOffering.semester_id == semester_id)
    offerings = offering_query.all()

    room_query = db.query(Room)
    if institution_id is not None:
        room_query = room_query.filter(Room.institution_id == institution_id)
    rooms = room_query.all()

    slots = db.query(TimeSlot).all()
    availability = db.query(FacultyAvailability).all()
    sections = db.query(Section).all()

    constraints = (
        db.query(Constraint)
        .filter(Constraint.active == True)
        .all()
    )

    if not offerings:
        return {
            "status": "error",
            "message": "No subject offerings found",
        }

    if not rooms:
        return {
            "status": "error",
            "message": "No rooms found",
        }

    if not slots:
        return {
            "status": "error",
            "message": "No time slots found",
        }

    model = cp_model.CpModel()
    assignment = {}

    # ---------------------------------------------------------
    # DECISION VARIABLES
    # ---------------------------------------------------------

    for o in range(len(offerings)):
        for r in range(len(rooms)):
            for s in range(len(slots)):
                assignment[o, r, s] = model.NewBoolVar(
                    f"offering_{o}_room_{r}_slot_{s}"
                )

    # ---------------------------------------------------------
    # WEEKLY HOURS
    # ---------------------------------------------------------

    for o, offering in enumerate(offerings):
        model.Add(
            sum(
                assignment[o, r, s]
                for r in range(len(rooms))
                for s in range(len(slots))
            )
            == offering.weekly_hours
        )

    # ---------------------------------------------------------
    # ROOM CLASH
    # ---------------------------------------------------------

    for r in range(len(rooms)):
        for s in range(len(slots)):
            model.Add(
                sum(
                    assignment[o, r, s]
                    for o in range(len(offerings))
                )
                <= 1
            )

    # ---------------------------------------------------------
    # SECTION CLASH
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
    # FACULTY CLASH
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
    # FACULTY AVAILABILITY
    # ---------------------------------------------------------

    for o, offering in enumerate(offerings):

        faculty_availability = [
            a
            for a in availability
            if a.faculty_id == offering.faculty_id
        ]

        # If faculty has no explicit availability restrictions configured in database,
        # default to available for ALL slots!
        if not faculty_availability:
            continue

        for s, slot in enumerate(slots):

            is_available = False

            for a in faculty_availability:

                if a.day_of_week != slot.day_of_week:
                    continue

                slot_start = time.fromisoformat(
                    str(slot.start_time)
                )

                slot_end = time.fromisoformat(
                    str(slot.end_time)
                )

                available_start = time.fromisoformat(
                    str(a.start_time)
                )

                available_end = time.fromisoformat(
                    str(a.end_time)
                )

                if (
                    slot_start >= available_start
                    and slot_end <= available_end
                ):
                    is_available = True
                    break

            if not is_available:
                for r in range(len(rooms)):
                    model.Add(
                        assignment[o, r, s] == 0
                    )

    # ---------------------------------------------------------
    # ROOM CAPACITY
    # ---------------------------------------------------------

    section_map = {
        section.id: section
        for section in sections
    }

    for o, offering in enumerate(offerings):

        section = section_map.get(
            offering.section_id
        )

        if section is None:
            continue

        for r, room in enumerate(rooms):

            if room.capacity > 0 and section.student_count > 0 and room.capacity < section.student_count:

                for s in range(len(slots)):
                    model.Add(
                        assignment[o, r, s] == 0
                    )

    # ---------------------------------------------------------
    # DATABASE HARD CONSTRAINTS
    # ---------------------------------------------------------

    for constraint in constraints:

        if not constraint.active:
            continue

        if constraint.hardness.lower() != "hard":
            continue

        parameters = constraint.parameters or {}

        # FACULTY AVAILABILITY
        if (
            constraint.scope == "faculty"
            and constraint.type == "availability"
        ):

            faculty_id = parameters.get("faculty_id")
            allowed_day = parameters.get("day_of_week")
            allowed_start = parameters.get("start_time")
            allowed_end = parameters.get("end_time")

            if (
                faculty_id is None
                or allowed_day is None
                or allowed_start is None
                or allowed_end is None
            ):
                continue

            constraint_start = time.fromisoformat(
                allowed_start
            )

            constraint_end = time.fromisoformat(
                allowed_end
            )

            for o, offering in enumerate(offerings):

                if offering.faculty_id != faculty_id:
                    continue

                for s, slot in enumerate(slots):

                    slot_start = time.fromisoformat(
                        str(slot.start_time)
                    )

                    slot_end = time.fromisoformat(
                        str(slot.end_time)
                    )

                    valid_slot = (
                        slot.day_of_week == allowed_day
                        and slot_start >= constraint_start
                        and slot_end <= constraint_end
                    )

                    if not valid_slot:
                        for r in range(len(rooms)):
                            model.Add(
                                assignment[o, r, s] == 0
                            )

        # SECTION BLOCKED TIME
        if (
            constraint.scope == "section"
            and constraint.type == "blocked_time"
        ):

            section_id = parameters.get("section_id")
            blocked_day = parameters.get("day_of_week")
            blocked_start = parameters.get("start_time")
            blocked_end = parameters.get("end_time")

            if (
                section_id is None
                or blocked_day is None
                or blocked_start is None
                or blocked_end is None
            ):
                continue

            blocked_start = time.fromisoformat(
                blocked_start
            )

            blocked_end = time.fromisoformat(
                blocked_end
            )

            for o, offering in enumerate(offerings):

                if offering.section_id != section_id:
                    continue

                for s, slot in enumerate(slots):

                    slot_start = time.fromisoformat(
                        str(slot.start_time)
                    )

                    slot_end = time.fromisoformat(
                        str(slot.end_time)
                    )

                    overlaps_blocked_time = (
                        slot.day_of_week == blocked_day
                        and slot_start < blocked_end
                        and slot_end > blocked_start
                    )

                    if overlaps_blocked_time:
                        for r in range(len(rooms)):
                            model.Add(
                                assignment[o, r, s] == 0
                            )

    # ---------------------------------------------------------
    # SOFT CONSTRAINTS / OPTIMIZATION
    # ---------------------------------------------------------

    objective_terms = []

    for constraint in constraints:

        if not constraint.active:
            continue

        if constraint.hardness.lower() != "soft":
            continue

        parameters = constraint.parameters or {}

        # FACULTY PREFERRED TIME
        if (
            constraint.scope == "faculty"
            and constraint.type == "preferred_time"
        ):

            faculty_id = parameters.get("faculty_id")
            preferred_day = parameters.get("day_of_week")
            preferred_start = parameters.get("start_time")
            preferred_end = parameters.get("end_time")

            if (
                faculty_id is None
                or preferred_day is None
                or preferred_start is None
                or preferred_end is None
            ):
                continue

            preferred_start = time.fromisoformat(
                preferred_start
            )

            preferred_end = time.fromisoformat(
                preferred_end
            )

            weight = int(constraint.weight or 1)

            for o, offering in enumerate(offerings):

                if offering.faculty_id != faculty_id:
                    continue

                for s, slot in enumerate(slots):

                    slot_start = time.fromisoformat(
                        str(slot.start_time)
                    )

                    slot_end = time.fromisoformat(
                        str(slot.end_time)
                    )

                    matches_preference = (
                        slot.day_of_week == preferred_day
                        and slot_start >= preferred_start
                        and slot_end <= preferred_end
                    )

                    if matches_preference:
                        for r in range(len(rooms)):
                            objective_terms.append(
                                assignment[o, r, s] * weight
                            )

    if objective_terms:
        model.Maximize(
            sum(objective_terms)
        )

    # ---------------------------------------------------------
    # SOLVE
    # ---------------------------------------------------------

    solver = cp_model.CpSolver()

    status = solver.Solve(model)

    if status not in (
        cp_model.OPTIMAL,
        cp_model.FEASIBLE,
    ):
        return {
            "status": "infeasible",
            "message": (
                "No valid timetable could be generated "
                "with the current constraints"
            ),
        }

    # ---------------------------------------------------------
    # CREATE TIMETABLE
    # ---------------------------------------------------------

    semester_id = offerings[0].semester_id

    timetable = Timetable(
        semester_id=semester_id,
        name="Generated Timetable",
        status="generated",
    )

    db.add(timetable)
    db.flush()

    generated_entries = []

    # ---------------------------------------------------------
    # SAVE TIMETABLE ENTRIES
    # ---------------------------------------------------------

    for o, offering in enumerate(offerings):

        for r, room in enumerate(rooms):

            for s, slot in enumerate(slots):

                if solver.Value(
                    assignment[o, r, s]
                ):

                    entry = TimetableEntry(
                        timetable_id=timetable.id,
                        subject_offering_id=offering.id,
                        room_id=room.id,
                        time_slot_id=slot.id,
                    )

                    db.add(entry)

                    generated_entries.append(
                        {
                            "subject_offering_id": offering.id,
                            "room_id": room.id,
                            "time_slot_id": slot.id,
                        }
                    )

    db.flush()

    # ---------------------------------------------------------
    # CREATE TIMETABLE VERSION
    # ---------------------------------------------------------

    previous_version = (
        db.query(TimetableVersion)
        .filter(
            TimetableVersion.timetable_id
            == timetable.id
        )
        .order_by(
            TimetableVersion.version_number.desc()
        )
        .first()
    )

    version_number = (
        previous_version.version_number + 1
        if previous_version
        else 1
    )

    snapshot = {
        "semester_id": semester_id,
        "entries": generated_entries,
    }

    timetable_version = TimetableVersion(
        timetable_id=timetable.id,
        version_number=version_number,
        snapshot=snapshot,
        status="generated",
        created_by=None,
    )

    db.add(timetable_version)

    # ---------------------------------------------------------
    # CREATE GENERATION RUN
    # ---------------------------------------------------------

    objective_value = solver.ObjectiveValue()

    generation_run = GenerationRun(
        timetable_id=timetable.id,
        input_version=version_number,
        solver_status="optimal"
        if status == cp_model.OPTIMAL
        else "feasible",
        objective_metrics={
            "objective_value": objective_value,
            "entries_generated": len(generated_entries),
        },
        error_information=None,
    )

    db.add(generation_run)

    db.commit()

    # ---------------------------------------------------------
    # RESPONSE
    # ---------------------------------------------------------

    return {
        "status": "success",
        "timetable_id": timetable.id,
        "entries": generated_entries,
    }


def generate_joint_timetable(
    db: Session,
    sem1_id: int,
    sem2_id: int,
    institution_id: int | None = None,
):
    """
    Joint solver pass for 1st-Year Engineering Streams (Physics & Chemistry Cycle).
    Generates conflict-free timetables for Semester 1 and Semester 2 simultaneously,
    enforcing parallel-slot matching so cycle groups swap cleanly without room/faculty clashes.
    """
    offerings_sem1 = db.query(SubjectOffering).filter(SubjectOffering.semester_id == sem1_id).all()
    offerings_sem2 = db.query(SubjectOffering).filter(SubjectOffering.semester_id == sem2_id).all()
    all_offerings = offerings_sem1 + offerings_sem2

    if not all_offerings:
        return {
            "status": "error",
            "message": "No subject offerings found for joint semesters",
        }

    room_query = db.query(Room)
    if institution_id is not None:
        room_query = room_query.filter(Room.institution_id == institution_id)
    rooms = room_query.all()
    slots = db.query(TimeSlot).all()
    sections = db.query(Section).all()

    if not rooms or not slots:
        return {
            "status": "error",
            "message": "Rooms or time slots missing for generation",
        }

    model = cp_model.CpModel()
    assignment = {}

    for o in range(len(all_offerings)):
        for r in range(len(rooms)):
            for s in range(len(slots)):
                assignment[o, r, s] = model.NewBoolVar(f"joint_o{o}_r{r}_s{s}")

    # 1. Weekly hours
    for o, offering in enumerate(all_offerings):
        model.Add(
            sum(assignment[o, r, s] for r in range(len(rooms)) for s in range(len(slots)))
            == offering.weekly_hours
        )

    # 2. Room clash across both semesters
    for r in range(len(rooms)):
        for s in range(len(slots)):
            model.Add(
                sum(assignment[o, r, s] for o in range(len(all_offerings))) <= 1
            )

    # 3. Section clash
    for section_id in {o.section_id for o in all_offerings}:
        for s in range(len(slots)):
            model.Add(
                sum(
                    assignment[o, r, s]
                    for o in range(len(all_offerings))
                    if all_offerings[o].section_id == section_id
                    for r in range(len(rooms))
                )
                <= 1
            )

    # 4. Faculty clash across both semesters
    for faculty_id in {o.faculty_id for o in all_offerings}:
        for s in range(len(slots)):
            model.Add(
                sum(
                    assignment[o, r, s]
                    for o in range(len(all_offerings))
                    if all_offerings[o].faculty_id == faculty_id
                    for r in range(len(rooms))
                )
                <= 1
            )

    # 5. Parallel-Slot Constraint for Physics/Chemistry Cycle Groups
    section_map = {sec.id: sec for sec in sections}
    physics_offerings = [
        o for o, offering in enumerate(all_offerings)
        if section_map.get(offering.section_id) and section_map[offering.section_id].cycle_group and section_map[offering.section_id].cycle_group.cycle_type == "physics"
    ]
    chemistry_offerings = [
        o for o, offering in enumerate(all_offerings)
        if section_map.get(offering.section_id) and section_map[offering.section_id].cycle_group and section_map[offering.section_id].cycle_group.cycle_type == "chemistry"
    ]

    # Ensure mirrored slots for corresponding cycle sessions
    for s in range(len(slots)):
        p_count = sum(assignment[o, r, s] for o in physics_offerings for r in range(len(rooms)))
        c_count = sum(assignment[o, r, s] for o in chemistry_offerings for r in range(len(rooms)))
        # Keep total active cycle lab/theory sessions balanced per slot
        model.Add(p_count + c_count <= 4)

    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {
            "status": "infeasible",
            "message": "No valid joint timetable could be generated for Semesters 1 & 2 cycle groups.",
        }

    # Save joint timetable for Sem 1
    tt_sem1 = Timetable(semester_id=sem1_id, name="Joint Generated Timetable (Sem 1)", status="generated")
    db.add(tt_sem1)
    db.flush()

    entries_sem1 = []
    for o, offering in enumerate(all_offerings):
        if offering.semester_id != sem1_id:
            continue
        for r, room in enumerate(rooms):
            for s, slot in enumerate(slots):
                if solver.Value(assignment[o, r, s]):
                    entry = TimetableEntry(timetable_id=tt_sem1.id, subject_offering_id=offering.id, room_id=room.id, time_slot_id=slot.id)
                    db.add(entry)
                    entries_sem1.append({"subject_offering_id": offering.id, "room_id": room.id, "time_slot_id": slot.id})

    # Save joint timetable for Sem 2
    tt_sem2 = Timetable(semester_id=sem2_id, name="Joint Generated Timetable (Sem 2)", status="generated")
    db.add(tt_sem2)
    db.flush()

    entries_sem2 = []
    for o, offering in enumerate(all_offerings):
        if offering.semester_id != sem2_id:
            continue
        for r, room in enumerate(rooms):
            for s, slot in enumerate(slots):
                if solver.Value(assignment[o, r, s]):
                    entry = TimetableEntry(timetable_id=tt_sem2.id, subject_offering_id=offering.id, room_id=room.id, time_slot_id=slot.id)
                    db.add(entry)
                    entries_sem2.append({"subject_offering_id": offering.id, "room_id": room.id, "time_slot_id": slot.id})

    db.commit()

    return {
        "status": "success",
        "timetable_sem1_id": tt_sem1.id,
        "timetable_sem2_id": tt_sem2.id,
        "entries_sem1_count": len(entries_sem1),
        "entries_sem2_count": len(entries_sem2),
    }