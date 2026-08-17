from ortools.sat.python import cp_model


def add_basic_constraints(
    timetable_model,
    offering_sections: list[int],
    offering_faculty: list[int],
):
    model = timetable_model.model
    assignment = timetable_model.assignment

    num_offerings = timetable_model.num_offerings
    num_rooms = timetable_model.num_rooms
    num_slots = timetable_model.num_time_slots

    # 1. Every offering must be scheduled exactly once.
    for offering in range(num_offerings):
        model.Add(
            sum(
                assignment[offering, room, slot]
                for room in range(num_rooms)
                for slot in range(num_slots)
            )
            == 1
        )

    # 2. A room cannot contain two offerings in the same time slot.
    for room in range(num_rooms):
        for slot in range(num_slots):
            model.Add(
                sum(
                    assignment[offering, room, slot]
                    for offering in range(num_offerings)
                )
                <= 1
            )

    # 3. A section cannot have two offerings in the same time slot.
    for section in set(offering_sections):
        for slot in range(num_slots):
            model.Add(
                sum(
                    assignment[offering, room, slot]
                    for offering in range(num_offerings)
                    if offering_sections[offering] == section
                    for room in range(num_rooms)
                )
                <= 1
            )

    # 4. A faculty member cannot teach two offerings at the same time.
    for faculty in set(offering_faculty):
        for slot in range(num_slots):
            model.Add(
                sum(
                    assignment[offering, room, slot]
                    for offering in range(num_offerings)
                    if offering_faculty[offering] == faculty
                    for room in range(num_rooms)
                )
                <= 1
            )