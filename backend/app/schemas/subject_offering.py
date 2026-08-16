from pydantic import BaseModel, ConfigDict


class SubjectOfferingCreate(BaseModel):
    subject_id: int
    faculty_id: int
    section_id: int
    semester_id: int
    weekly_hours: int


class SubjectOfferingResponse(SubjectOfferingCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
