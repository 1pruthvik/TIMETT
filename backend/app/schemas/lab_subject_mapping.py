from pydantic import BaseModel, ConfigDict


class LabSubjectMappingBase(BaseModel):
    subject_id: int
    lab_id: int


class LabSubjectMappingCreate(LabSubjectMappingBase):
    pass


class LabSubjectMappingResponse(LabSubjectMappingBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
