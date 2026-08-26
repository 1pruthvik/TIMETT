from sqlalchemy import ForeignKey, String, Integer, DateTime, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from app.db.database import Base


class GenerationRun(Base):
    __tablename__ = "generation_runs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    timetable_id: Mapped[int | None] = mapped_column(
        ForeignKey("timetables.id"),
        nullable=True,
        index=True,
    )

    academic_year_id: Mapped[int | None] = mapped_column(
        ForeignKey("academic_years.id"),
        nullable=True,
        index=True,
    )

    generation_type: Mapped[str] = mapped_column(
        String(50),
        default="single",
        nullable=False,
    )  # single, joint_first_year

    solver_status: Mapped[str] = mapped_column(
        String(50),
        default="QUEUED",
        nullable=False,
    )  # QUEUED, RUNNING, SUCCESS, INFEASIBLE, TIMEOUT, FAILED

    objective_score: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    conflict_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    conflict_details: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    objective_metrics: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    error_information: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )
