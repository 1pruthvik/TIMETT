from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class LabSubjectMapping(Base):
    __tablename__ = "lab_subject_mappings"
    __table_args__ = (
        UniqueConstraint("subject_id", "lab_id", name="uq_lab_subject_mapping"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    subject_id: Mapped[int] = mapped_column(
        ForeignKey("subjects.id"),
        nullable=False,
        index=True,
    )
    lab_id: Mapped[int] = mapped_column(
        ForeignKey("labs.id"),
        nullable=False,
        index=True,
    )

    # Relationships
    subject = relationship("Subject", back_populates="lab_mappings")
    lab = relationship("Lab", back_populates="subject_mappings")
