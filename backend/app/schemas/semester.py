from pydantic import BaseModel, ConfigDict


class SemesterCreate(BaseModel):
    academic_year_id: int
    name: str


class SemesterResponse(SemesterCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
