from pydantic import BaseModel, ConfigDict


class SectionBase(BaseModel):
    department_id: int
    name: str
    student_count: int = 60
    room_number: str | None = None
    stream_id: int | None = None
    cycle_group: str | None = None
    batch_count: int = 2


class SectionCreate(SectionBase):
    pass


class SectionUpdate(BaseModel):
    department_id: int | None = None
    name: str | None = None
    student_count: int | None = None
    room_number: str | None = None
    stream_id: int | None = None
    cycle_group: str | None = None
    batch_count: int | None = None


class SectionResponse(SectionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)