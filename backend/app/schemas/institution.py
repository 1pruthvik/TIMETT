from pydantic import BaseModel, ConfigDict


class InstitutionBase(BaseModel):
    name: str


class InstitutionCreate(InstitutionBase):
    pass


class InstitutionResponse(InstitutionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)