from pydantic import BaseModel, ConfigDict


class TimetableEntryCreate(BaseModel):
    timetable_id: int
    subject_offering_id: int
    room_id: int
    time_slot_id: int


class TimetableEntryResponse(TimetableEntryCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
