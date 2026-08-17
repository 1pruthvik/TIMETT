from pydantic import BaseModel, ConfigDict
from typing import Any


class TimetableVersionCreate(BaseModel):
    timetable_id: int
    version_number: int
    snapshot: dict[str, Any] | None = None
    status: str
    created_by: int | None = None


class TimetableVersionResponse(TimetableVersionCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
