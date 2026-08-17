from ortools.sat.python import cp_model


class TimetableModel:
    def __init__(
        self,
        num_offerings: int,
        num_rooms: int,
        num_time_slots: int,
    ):
        self.model = cp_model.CpModel()

        self.num_offerings = num_offerings
        self.num_rooms = num_rooms
        self.num_time_slots = num_time_slots

        # Decision variable:
        # assignment[offering, room, time_slot] = 1
        # if the offering is scheduled in that room and time slot.
        self.assignment = {}

        for offering in range(num_offerings):
            for room in range(num_rooms):
                for slot in range(num_time_slots):
                    self.assignment[
                        offering, room, slot
                    ] = self.model.NewBoolVar(
                        f"offering_{offering}_room_{room}_slot_{slot}"
                    )

    def get_variable(self, offering: int, room: int, slot: int):
        return self.assignment[offering, room, slot]