from pydantic import BaseModel, ConfigDict


class LabBase(BaseModel):
    institution_id: int
    name: str
    code: str | None = None
    room_number: str | None = None
    capacity: int = 30
    num_physical_labs: int = 1
    department_id: int | None = None


class LabCreate(LabBase):
    pass


class LabUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    room_number: str | None = None
    capacity: int | None = None
    num_physical_labs: int | None = None
    department_id: int | None = None


class LabResponse(LabBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
