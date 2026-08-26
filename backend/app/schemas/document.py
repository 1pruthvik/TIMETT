from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DocumentBase(BaseModel):
    filename: str
    file_type: str
    doc_type: str = "syllabus"
    institution_id: int | None = None


class DocumentCreate(DocumentBase):
    extracted_data: dict | None = None
    raw_text: str | None = None


class DocumentConfirmRequest(BaseModel):
    confirmed_branches: list[dict] | None = None
    confirmed_subjects: list[dict] | None = None
    confirmed_faculty: list[dict] | None = None


class DocumentResponse(DocumentBase):
    id: int
    status: str
    extracted_data: dict | None = None
    uploaded_at: datetime
    confirmed_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)
