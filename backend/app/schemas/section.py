from pydantic import BaseModel, ConfigDict


class SectionCreate(BaseModel):
    department_id: int
    name: str
    student_count: int = 0
    room_number: str | None = None


class SectionResponse(SectionCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)