from datetime import datetime, timezone
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from ..database import Base

class Analysis(Base):
    __tablename__ = "analyses"
    id = Column(Integer, primary_key=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False, index=True)
    plant_name = Column(String(100), nullable=False)
    observation_date = Column(Date, nullable=False)
    location = Column(String(120), nullable=False)
    symptoms = Column(Text, nullable=False)
    result = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    plant = relationship("Plant", back_populates="analyses")
