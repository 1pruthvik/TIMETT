from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Subject(Base):
    __tablename__ = "subjects"
    __table_args__ = (
        UniqueConstraint("department_id", "code", name="uq_subjects_dept_code"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id"),
        nullable=False,
        index=True,
    )
    stream_id: Mapped[int | None] = mapped_column(
        ForeignKey("streams.id"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    is_lab: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    subject_type: Mapped[str] = mapped_column(String(50), default="Theory", nullable=False)  # Theory, Lab
    weekly_hours: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    cycle_group: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Physics, Chemistry, None (Common)
    scheme: Mapped[str | None] = mapped_column(String(50), nullable=True)  # e.g., "2022 Scheme", "2024 Scheme"
    semester_name: Mapped[str | None] = mapped_column(String(50), nullable=True)  # e.g., "Semester 1", "Semester 3"

    # Relationships
    department = relationship("Department")
    stream = relationship("Stream", back_populates="subjects")
    lab_mappings = relationship("LabSubjectMapping", back_populates="subject", cascade="all, delete-orphan")

    @property
    def department_name(self) -> str | None:
        return self.department.name if self.department else None
