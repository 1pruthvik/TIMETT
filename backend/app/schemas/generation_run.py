from datetime import datetime
from pydantic import BaseModel, ConfigDict


class GenerationRunBase(BaseModel):
    timetable_id: int | None = None
    academic_year_id: int | None = None
    generation_type: str = "single"
    solver_status: str = "QUEUED"
    objective_score: int | None = None
    conflict_count: int = 0
    conflict_details: dict | None = None
    objective_metrics: dict | None = None
    error_information: str | None = None


class GenerationRunCreate(GenerationRunBase):
    pass


class GenerationRunResponse(GenerationRunBase):
    id: int
    started_at: datetime
    completed_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)
