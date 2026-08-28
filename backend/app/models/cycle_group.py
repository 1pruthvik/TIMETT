from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class CycleGroup(Base):
    __tablename__ = "cycle_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    cycle_type = Column(String, nullable=False)  # "physics" or "chemistry"
    stream_id = Column(Integer, ForeignKey("streams.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    stream = relationship("Stream", back_populates="cycle_groups")
    sections = relationship("Section", back_populates="cycle_group")
