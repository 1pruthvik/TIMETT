from pydantic import BaseModel, ConfigDict


class TimeSlotCreate(BaseModel):
    day_of_week: str
    start_time: str
    end_time: str


class TimeSlotResponse(TimeSlotCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
