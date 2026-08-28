from pydantic import BaseModel, ConfigDict


class TimetableEntryBase(BaseModel):
    timetable_id: int
    subject_offering_id: int
    room_id: int | None = None
    lab_id: int | None = None
    batch_id: int | None = None
    time_slot_id: int
    stream_id: int | None = None
    cycle_group: str | None = None
    paired_slot_group: str | None = None


class TimetableEntryCreate(TimetableEntryBase):
    pass


class TimetableEntryUpdate(BaseModel):
    room_id: int | None = None
    lab_id: int | None = None
    batch_id: int | None = None
    time_slot_id: int | None = None
    stream_id: int | None = None
    cycle_group: str | None = None
    paired_slot_group: str | None = None


class TimetableEntryResponse(TimetableEntryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
