from pydantic import BaseModel, ConfigDict


class StreamBase(BaseModel):
    institution_id: int
    name: str
    code: str
    description: str | None = None


class StreamCreate(StreamBase):
    pass


class StreamUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    description: str | None = None


class StreamResponse(StreamBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
