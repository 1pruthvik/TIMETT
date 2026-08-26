from pydantic import BaseModel, ConfigDict


class BranchBase(BaseModel):
    institution_id: int
    name: str
    code: str
    student_count: int = 60
    department_id: int | None = None
    stream_id: int | None = None


class BranchCreate(BranchBase):
    pass


class BranchUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    student_count: int | None = None
    department_id: int | None = None
    stream_id: int | None = None


class BranchResponse(BranchBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
