from pydantic import BaseModel, ConfigDict


class InstitutionCreate(BaseModel):
    name: str


class InstitutionResponse(InstitutionCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)