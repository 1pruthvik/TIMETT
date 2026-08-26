from pydantic import BaseModel, Field


class SubjectOfferingInput(BaseModel):
    id: int
    subject_id: int
    subject_code: str
    subject_name: str
    faculty_id: int
    faculty_name: str
    section_id: int
    section_name: str
    semester_id: int
    weekly_hours: int = 4
    is_lab: bool = False
    stream_id: int | None = None
    cycle_group: str | None = None
    target_lab_id: int | None = None


class RoomInput(BaseModel):
    id: int
    name: str
    capacity: int = 60
    is_lab: bool = False


class LabInput(BaseModel):
    id: int
    name: str
    capacity: int = 30
    num_physical_labs: int = 1


class TimeSlotInput(BaseModel):
    id: int
    day_of_week: str
    period_number: int | None = None
    start_time: str
    end_time: str


class FacultyAvailabilityInput(BaseModel):
    faculty_id: int
    day_of_week: str
    start_time: str
    end_time: str


class SchedulingInput(BaseModel):
    institution_id: int = 1
    semester_id: int | None = None
    semester_ids: list[int] = Field(default_factory=list)
    generation_type: str = "single"  # single or joint_first_year
    offerings: list[SubjectOfferingInput] = Field(default_factory=list)
    rooms: list[RoomInput] = Field(default_factory=list)
    labs: list[LabInput] = Field(default_factory=list)
    slots: list[TimeSlotInput] = Field(default_factory=list)
    availabilities: list[FacultyAvailabilityInput] = Field(default_factory=list)
