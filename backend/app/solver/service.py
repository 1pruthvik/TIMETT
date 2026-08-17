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
            return {
                "status": "error",
                "message": (
                    f"Section {offering.section_id} "
                    "not found"
                ),
            }

        for r, room in enumerate(rooms):

            if room.capacity < section.student_count:

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