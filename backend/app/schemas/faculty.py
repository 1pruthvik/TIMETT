from pydantic import BaseModel, ConfigDict


class FacultyCreate(BaseModel):
    department_id: int
    name: str
    designation: str | None = None


class FacultyResponse(FacultyCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
