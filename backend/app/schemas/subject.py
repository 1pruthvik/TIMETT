from pydantic import BaseModel, ConfigDict


class SubjectBase(BaseModel):
    department_id: int
    name: str
    code: str
    is_lab: bool = False
    subject_type: str = "Theory"
    weekly_hours: int = 4
    stream_id: int | None = None
    cycle_group: str | None = None
    scheme: str | None = None
    semester_name: str | None = None
    department_name: str | None = None


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    department_id: int | None = None
    name: str | None = None
    code: str | None = None
    is_lab: bool | None = None
    subject_type: str | None = None
    weekly_hours: int | None = None
    stream_id: int | None = None
    cycle_group: str | None = None
    scheme: str | None = None
    semester_name: str | None = None
    department_name: str | None = None


class SubjectResponse(SubjectBase):
    id: int
    department_name: str | None = None
    model_config = ConfigDict(from_attributes=True)
