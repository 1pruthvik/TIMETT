from sqlalchemy import ForeignKey, String, DateTime, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from app.db.database import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    institution_id: Mapped[int | None] = mapped_column(
        ForeignKey("institutions.id"),
        nullable=True,
        index=True,
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)  # pdf, docx, png, jpg
    doc_type: Mapped[str] = mapped_column(String(50), default="syllabus", nullable=False)  # syllabus, faculty_roster, general
    status: Mapped[str] = mapped_column(String(50), default="PENDING_REVIEW", nullable=False)  # PENDING_REVIEW, CONFIRMED, REJECTED
    extracted_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
