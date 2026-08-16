from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class SubjectOffering(Base):
    __tablename__ = "subject_offerings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    subject_id: Mapped[int] = mapped_column(
        ForeignKey("subjects.id"),
        nullable=False,
        index=True,
    )

    faculty_id: Mapped[int] = mapped_column(
        ForeignKey("faculty.id"),
        nullable=False,
        index=True,
    )

    section_id: Mapped[int] = mapped_column(
        ForeignKey("sections.id"),
        nullable=False,
        index=True,
    )

    semester_id: Mapped[int] = mapped_column(
        ForeignKey("semesters.id"),
        nullable=False,
        index=True,
    )

    weekly_hours: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
