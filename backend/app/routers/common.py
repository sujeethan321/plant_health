from fastapi import HTTPException
from sqlalchemy.orm import Session


def get_or_404(db: Session, model, item_id: int):
    item = db.get(model, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail=f"{model.__name__} {item_id} not found")
    return item
