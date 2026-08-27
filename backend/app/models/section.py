from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Section(Base):
    __tablename__ = "sections"

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

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    student_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=60,
    )

    room_number: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    cycle_group_id: Mapped[int | None] = mapped_column(
        ForeignKey("cycle_groups.id"),
        nullable=True,
        index=True,
    )

    batch_count: Mapped[int] = mapped_column(
        Integer,
        default=2,
        nullable=False,
    )

    # Relationships
    stream = relationship("Stream", back_populates="sections", foreign_keys=[stream_id])
    cycle_group = relationship("CycleGroup", back_populates="sections", foreign_keys=[cycle_group_id])
    batches = relationship("Batch", back_populates="section", cascade="all, delete-orphan")
