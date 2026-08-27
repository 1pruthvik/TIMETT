from datetime import datetime
from sqlalchemy import ForeignKey, Integer, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Stream(Base):
    __tablename__ = "streams"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    institution_id: Mapped[int | None] = mapped_column(
        ForeignKey("institutions.id"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    branches = relationship("Branch", back_populates="stream", cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="stream")
    sections = relationship("Section", back_populates="stream", foreign_keys="[Section.stream_id]")
    cycle_groups = relationship("CycleGroup", back_populates="stream", cascade="all, delete-orphan")

