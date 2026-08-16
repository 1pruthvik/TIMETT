from sqlalchemy import ForeignKey
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

    room_id: Mapped[int] = mapped_column(
        ForeignKey("rooms.id"),
        nullable=False,
        index=True,
    )

    time_slot_id: Mapped[int] = mapped_column(
        ForeignKey("time_slots.id"),
        nullable=False,
        index=True,
    )
