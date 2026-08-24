from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Section(Base):
    __tablename__ = "sections"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    student_count: Mapped[int] = mapped_column(
        nullable=False,
        default=0,
    )

    room_number: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )