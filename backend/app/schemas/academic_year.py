from pydantic import BaseModel, ConfigDict


class AcademicYearCreate(BaseModel):
    institution_id: int
    name: str


class AcademicYearResponse(AcademicYearCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
