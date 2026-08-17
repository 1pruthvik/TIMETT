from pydantic import BaseModel, ConfigDict


class FacultyAvailabilityCreate(BaseModel):
    faculty_id: int
    day_of_week: str
    start_time: str
    end_time: str


class FacultyAvailabilityResponse(FacultyAvailabilityCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
