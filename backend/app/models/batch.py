from sqlalchemy import ForeignKey, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Batch(Base):
    __tablename__ = "batches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    section_id: Mapped[int] = mapped_column(
        ForeignKey("sections.id"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., "B1", "B2"
    student_count: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    batch_index: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    section = relationship("Section", back_populates="batches")
