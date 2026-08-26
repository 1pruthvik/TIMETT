from pydantic import BaseModel, ConfigDict


class BatchBase(BaseModel):
    section_id: int
    name: str
    student_count: int = 30
    batch_index: int = 1


class BatchCreate(BatchBase):
    pass


class BatchUpdate(BaseModel):
    name: str | None = None
    student_count: int | None = None
    batch_index: int | None = None


class BatchResponse(BatchBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
