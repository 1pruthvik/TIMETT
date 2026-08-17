from sqlalchemy.orm import Session
from ortools.sat.python import cp_model

from app.models.subject_offering import SubjectOffering
from app.models.room import Room
from app.models.time_slot import TimeSlot
from app.models.timetable import Timetable
from app.models.timetable_entry import TimetableEntry
from app.models.faculty_availability import FacultyAvailability


def generate_timetable(db: Session):
    offerings = db.query(SubjectOffering).all()
    rooms = db.query(Room).all()
    slots = db.query(TimeSlot).all()
    availabilities = db.query(FacultyAvailability).all()

    if not offerings:
        return {"status": "error", "message": "No subject offerings found"}

    if not rooms:
        return {"status": "error", "message": "No rooms found"}

    if not slots:
        return {"status": "error", "message": "No time slots found"}

    model = cp_model.CpModel()
    assignment = {}

    for o in range(len(offerings)):
        for r in range(len(rooms)):
            for s in range(len(slots)):
                assignment[o, r, s] = model.NewBoolVar(
                    f"offering_{o}_room_{r}_slot_{s}"
                )

    # 1. Every offering must be scheduled exactly once.
    for o in range(len(offerings)):
        model.Add(
            sum(
                assignment[o, r, s]
                for r in range(len(rooms))
                for s in range(len(slots))
            )
            == 1
        )

    # 2. A room cannot host two classes simultaneously.
    for r in range(len(rooms)):
        for s in range(len(slots)):
            model.Add(
                sum(
                    assignment[o, r, s]
                    for o in range(len(offerings))
                )
                <= 1
            )

    # 3. A section cannot have two classes simultaneously.
    section_ids = {o.section_id for o in offerings}

    for section_id in section_ids:
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

    # 4. A faculty member cannot teach two classes simultaneously.
    faculty_ids = {o.faculty_id for o in offerings}

    for faculty_id in faculty_ids:
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

    # 5. Faculty Availability Constraint:
    # If a faculty member has configured availability records, disallow any slot not in their allowed windows.
    faculty_allowed_slots = {}
    for avail in availabilities:
        key = (avail.day_of_week.lower(), avail.start_time)
        faculty_allowed_slots.setdefault(avail.faculty_id, set()).add(key)

    for o, offering in enumerate(offerings):
        fac_id = offering.faculty_id
        if fac_id in faculty_allowed_slots:
            allowed = faculty_allowed_slots[fac_id]
            for s, slot in enumerate(slots):
                slot_key = (slot.day_of_week.lower(), slot.start_time)
                if slot_key not in allowed:
                    # Forbid assigning this offering in this slot
                    for r in range(len(rooms)):
                        model.Add(assignment[o, r, s] == 0)

    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {
            "status": "infeasible",
            "message": "No valid timetable could be generated with current mandatory constraints.",
        }

    # Create timetable.
    semester_id = offerings[0].semester_id

    timetable = Timetable(
        semester_id=semester_id,
        name="Generated Timetable",
        status="generated",
    )

    db.add(timetable)
    db.flush()

    generated_entries = []

    for o, offering in enumerate(offerings):
        for r, room in enumerate(rooms):
            for s, slot in enumerate(slots):
                if solver.Value(assignment[o, r, s]):
                    entry = TimetableEntry(
                        timetable_id=timetable.id,
                        subject_offering_id=offering.id,
                        room_id=room.id,
                        time_slot_id=slot.id,
                    )

                    db.add(entry)

                    generated_entries.append({
                        "subject_offering_id": offering.id,
                        "room_id": room.id,
                        "time_slot_id": slot.id,
                    })

    db.commit()

    return {
        "status": "success",
        "timetable_id": timetable.id,
        "entries": generated_entries,
    }