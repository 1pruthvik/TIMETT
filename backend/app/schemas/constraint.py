from pydantic import BaseModel, ConfigDict
from typing import Any


class ConstraintCreate(BaseModel):
    scope: str
    type: str
    hardness: str
    priority: int | None = None
    weight: float | None = None
    parameters: dict[str, Any] | None = None
    source: str
    created_by: int | None = None
    explanation: str | None = None
    active: bool = True


class ConstraintResponse(ConstraintCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
