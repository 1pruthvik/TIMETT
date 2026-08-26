from sqlalchemy import ForeignKey, String, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    timetable_id: Mapped[int] = mapped_column(
        ForeignKey("timetables.id"),
        nullable=False,
        index=True,
    )

    subject_offering_id: Mapped[int] = mapped_column(
        ForeignKey("subject_offerings.id"),
        nullable=False,
        index=True,
    )

    room_id: Mapped[int | None] = mapped_column(
        ForeignKey("rooms.id"),
        nullable=True,
        index=True,
    )

    lab_id: Mapped[int | None] = mapped_column(
        ForeignKey("labs.id"),
        nullable=True,
        index=True,
    )

    batch_id: Mapped[int | None] = mapped_column(
        ForeignKey("batches.id"),
        nullable=True,
        index=True,
    )

    time_slot_id: Mapped[int] = mapped_column(
        ForeignKey("time_slots.id"),
        nullable=False,
        index=True,
    )

    stream_id: Mapped[int | None] = mapped_column(
        ForeignKey("streams.id"),
        nullable=True,
        index=True,
    )

    cycle_group: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )  # Physics, Chemistry

    paired_slot_group: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )  # Links paired Physics/Chemistry slots
