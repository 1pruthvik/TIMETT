from typing import Any
from collections import defaultdict


class TimetableValidator:
    """
    Independent Deterministic Validator for Chronon Timetables.
    Verifies candidate solutions without relying on the solver's internal state.
    """

    @classmethod
    def validate(
        cls,
        entries: list[dict[str, Any]],
        rooms: list[dict[str, Any]],
        labs: list[dict[str, Any]],
        slots: list[dict[str, Any]],
        is_first_year_joint: bool = False,
    ) -> dict[str, Any]:
        """
        Validates all hard constraints and returns a structured validation report.
        """
        conflicts: list[dict[str, Any]] = []

        # Maps for quick lookup
        faculty_slot_map = defaultdict(list)
        section_slot_map = defaultdict(list)
        room_slot_map = defaultdict(list)
        lab_slot_map = defaultdict(list)
        paired_slots = defaultdict(list)

        for entry in entries:
            slot_id = entry.get("time_slot_id")
            fac_id = entry.get("faculty_id")
            sec_id = entry.get("section_id")
            rm_id = entry.get("room_id")
            lb_id = entry.get("lab_id")
            paired_group = entry.get("paired_slot_group")

            if fac_id and slot_id:
                faculty_slot_map[(fac_id, slot_id)].append(entry)
            if sec_id and slot_id:
                section_slot_map[(sec_id, slot_id)].append(entry)
            if rm_id and slot_id:
                room_slot_map[(rm_id, slot_id)].append(entry)
            if lb_id and slot_id:
                lab_slot_map[(lb_id, slot_id)].append(entry)
            if paired_group and slot_id:
                paired_slots[paired_group].append((slot_id, entry))

        # 1. Check Faculty Clashes
        for (fac_id, slot_id), grouped in faculty_slot_map.items():
            if len(grouped) > 1:
                conflicts.append({
                    "type": "FACULTY_CONFLICT",
                    "faculty_id": fac_id,
                    "time_slot_id": slot_id,
                    "count": len(grouped),
                    "description": f"Faculty #{fac_id} is double-booked across {len(grouped)} simultaneous classes in slot #{slot_id}.",
                })

        # 2. Check Section Clashes
        for (sec_id, slot_id), grouped in section_slot_map.items():
            if len(grouped) > 1:
                conflicts.append({
                    "type": "SECTION_CONFLICT",
                    "section_id": sec_id,
                    "time_slot_id": slot_id,
                    "count": len(grouped),
                    "description": f"Student Section #{sec_id} has {len(grouped)} simultaneous classes in slot #{slot_id}.",
                })

        # 3. Check Room Clashes
        for (rm_id, slot_id), grouped in room_slot_map.items():
            if len(grouped) > 1:
                conflicts.append({
                    "type": "ROOM_CONFLICT",
                    "room_id": rm_id,
                    "time_slot_id": slot_id,
                    "count": len(grouped),
                    "description": f"Room #{rm_id} is double-booked by {len(grouped)} simultaneous classes in slot #{slot_id}.",
                })

        # 4. Check Shared Physical Lab Collisions
        lab_capacity_map = {l.get("id"): l.get("num_physical_labs", 1) for l in labs}
        for (lb_id, slot_id), grouped in lab_slot_map.items():
            max_allowed = lab_capacity_map.get(lb_id, 1)
            if len(grouped) > max_allowed:
                conflicts.append({
                    "type": "LAB_CAPACITY_EXCEEDED",
                    "lab_id": lb_id,
                    "time_slot_id": slot_id,
                    "count": len(grouped),
                    "max_allowed": max_allowed,
                    "description": f"Physical Lab #{lb_id} capacity exceeded: {len(grouped)} concurrent batches scheduled (Max capacity: {max_allowed}) in slot #{slot_id}.",
                })

        # 5. Check First-Year Paired-Slot Consistency
        if is_first_year_joint:
            for pair_group, paired_list in paired_slots.items():
                slot_indices = {item[0] for item in paired_list}
                if len(slot_indices) > 1:
                    conflicts.append({
                        "type": "PAIRED_SLOT_DESYNCHRONIZATION",
                        "paired_group": pair_group,
                        "description": f"First-Year Paired Cycle Group '{pair_group}' has desynchronized slot assignments.",
                    })

        is_valid = len(conflicts) == 0

        return {
            "is_valid": is_valid,
            "conflict_count": len(conflicts),
            "conflicts": conflicts,
            "status": "VALID" if is_valid else "INVALID",
            "summary": "All deterministic constraints verified with 0 hard conflicts." if is_valid else f"Detected {len(conflicts)} hard constraint violations.",
        }
