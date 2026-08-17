from pydantic import BaseModel, ConfigDict
from typing import Any
from datetime import datetime


class GenerationRunCreate(BaseModel):
    timetable_id: int
    input_version: int | None = None
    solver_status: str
    objective_metrics: dict[str, Any] | None = None
    error_information: str | None = None


class GenerationRunResponse(GenerationRunCreate):
    id: int
    generation_time: datetime

    model_config = ConfigDict(from_attributes=True)
