from pydantic import BaseModel, ConfigDict


class SubjectCreate(BaseModel):
    department_id: int
    name: str
    code: str


class SubjectResponse(SubjectCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
