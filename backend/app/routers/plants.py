from typing import List

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Analysis, Person, Plant
from ..schemas.analysis import AnalysisOut
from ..schemas.plant import PlantIn, PlantOut
from .common import get_or_404


router = APIRouter(prefix="/plants", tags=["Plants"])


@router.get("", response_model=List[PlantOut])
def list_plants(db: Session = Depends(get_db)):
    return db.query(Plant).order_by(Plant.id.desc()).all()


@router.post("", response_model=PlantOut, status_code=201)
def create_plant(data: PlantIn, db: Session = Depends(get_db)):
    if data.owner_id is not None:
        get_or_404(db, Person, data.owner_id)
    plant = Plant(**data.model_dump())
    db.add(plant)
    db.commit()
    db.refresh(plant)
    return plant


@router.get("/{plant_id}/analyses", response_model=List[AnalysisOut])
def list_analyses(plant_id: int, db: Session = Depends(get_db)):
    get_or_404(db, Plant, plant_id)
    return db.query(Analysis).filter(Analysis.plant_id == plant_id).order_by(Analysis.id.desc()).all()


@router.delete("/{plant_id}", status_code=204)
def delete_plant(plant_id: int, db: Session = Depends(get_db)):
    db.delete(get_or_404(db, Plant, plant_id))
    db.commit()
    return Response(status_code=204)
