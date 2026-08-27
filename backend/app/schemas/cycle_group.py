from datetime import datetime
from pydantic import BaseModel


class CycleGroupBase(BaseModel):
    name: str
    cycle_type: str  # "physics" or "chemistry"
    stream_id: int


class CycleGroupCreate(CycleGroupBase):
    pass


class CycleGroupUpdate(BaseModel):
    name: str | None = None
    cycle_type: str | None = None
    stream_id: int | None = None


class CycleGroupResponse(CycleGroupBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
