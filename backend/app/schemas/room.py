from pydantic import BaseModel, ConfigDict


class RoomCreate(BaseModel):
    institution_id: int
    name: str
    capacity: int
    room_type: str | None = None


class RoomResponse(RoomCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
