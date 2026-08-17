from pydantic import BaseModel, ConfigDict


class TimetableCreate(BaseModel):
    semester_id: int
    name: str
    status: str = "draft"


class TimetableResponse(TimetableCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
