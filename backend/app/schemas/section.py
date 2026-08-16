from pydantic import BaseModel, ConfigDict


class SectionCreate(BaseModel):
    department_id: int
    name: str


class SectionResponse(SectionCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
