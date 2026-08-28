from datetime import datetime
from pydantic import BaseModel, ConfigDict


class StreamBase(BaseModel):
    name: str
    code: str
    description: str | None = None
    institution_id: int | None = None


class StreamCreate(StreamBase):
    pass


class StreamUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    description: str | None = None
    institution_id: int | None = None


class StreamResponse(StreamBase):
    id: int
    created_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)

