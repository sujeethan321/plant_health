from typing import List

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Person, Plant
from ..schemas.person import PersonIn, PersonOut
from .common import get_or_404


router = APIRouter(prefix="/people", tags=["People"])


@router.get("", response_model=List[PersonOut])
def list_people(db: Session = Depends(get_db)):
    return db.query(Person).order_by(Person.name).all()


@router.post("", response_model=PersonOut, status_code=201)
def create_person(data: PersonIn, db: Session = Depends(get_db)):
    person = Person(**data.model_dump())
    db.add(person)
    db.commit()
    db.refresh(person)
    return person


@router.put("/{person_id}", response_model=PersonOut)
def update_person(person_id: int, data: PersonIn, db: Session = Depends(get_db)):
    person = get_or_404(db, Person, person_id)
    for field, value in data.model_dump().items():
        setattr(person, field, value)
    db.commit()
    db.refresh(person)
    return person


@router.delete("/{person_id}", status_code=204)
def delete_person(person_id: int, db: Session = Depends(get_db)):
    person = get_or_404(db, Person, person_id)
    # Keep the person's plants, but unassign them.
    db.query(Plant).filter(Plant.owner_id == person_id).update({"owner_id": None})
    db.delete(person)
    db.commit()
    return Response(status_code=204)
