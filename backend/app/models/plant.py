from sqlalchemy.orm import relationship
from sqlalchemy import Column, ForeignKey, Integer, String, Text

from ..database import Base


class Plant(Base):
    __tablename__ = "plants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    plant_type = Column(String(50), nullable=False)
    location = Column(String(120))
    symptoms = Column(Text, nullable=False)
    owner_id = Column(Integer, ForeignKey("people.id"))
    analyses = relationship("Analysis", back_populates="plant", cascade="all, delete-orphan")
