from sqlalchemy import ForeignKey, String, Integer, DateTime, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from app.db.database import Base


class GenerationRun(Base):
    __tablename__ = "generation_runs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    timetable_id: Mapped[int] = mapped_column(
        ForeignKey("timetables.id"),
        nullable=False,
        index=True,
    )

    input_version: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    solver_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    generation_time: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    objective_metrics: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    error_information: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
