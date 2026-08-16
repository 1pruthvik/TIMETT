from pydantic import BaseModel, ConfigDict


class DepartmentCreate(BaseModel):
    institution_id: int
    name: str


class DepartmentResponse(DepartmentCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
