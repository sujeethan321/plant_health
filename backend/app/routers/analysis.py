import base64
import json
from datetime import date
from typing import Annotated
from pydantic import ValidationError

from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session

from ..config import GEMINI_API_KEY, GEMINI_MODEL
from ..database import get_db
from ..models import Analysis, Plant
from ..schemas.analysis import AnalysisIn, AnalysisOut, AnalysisImage, MAX_IMAGE_BYTES
from ..services.ai_service import AnalysisServiceError, analyze_plant
from .common import get_or_404


router = APIRouter(prefix="/analysis", tags=["Analysis"])


@router.post("", response_model=AnalysisOut, status_code=201)
def analyze(
    plant_id: Annotated[int, Form(gt=0)],
    observation_date: Annotated[date, Form()],
    location: Annotated[str, Form(min_length=1, max_length=120)],
    symptoms: Annotated[str, Form(max_length=2000)] = "",
    image: Annotated[UploadFile | None, File()] = None,
    db: Session = Depends(get_db),
):
    plant = get_or_404(db, Plant, plant_id)
    image_data = None
    if image is not None:
        try:
            if image.content_type not in ("image/jpeg", "image/png", "image/webp"):
                raise HTTPException(400, "Only JPG, PNG, and WebP images are allowed.")
            raw = image.file.read(MAX_IMAGE_BYTES + 1)
            if not raw or len(raw) > MAX_IMAGE_BYTES:
                raise HTTPException(400, "Choose a nonempty image up to 5 MB.")
            try:
                image_data = AnalysisImage(mime_type=image.content_type, data=base64.b64encode(raw).decode("ascii"))
            except ValidationError:
                raise HTTPException(400, "The file does not match its JPEG, PNG, or WebP image type.") from None
        finally:
            image.file.close()
    try:
        data = AnalysisIn(plant_id=plant_id, observation_date=observation_date,
                          location=location, symptoms=symptoms, image=image_data)
    except ValidationError:
        raise HTTPException(422, "Enter a location and describe symptoms or upload a plant image.") from None
    try:
        result = analyze_plant(
            plant_name=plant.name,
            plant_type=plant.plant_type,
            observation_date=data.observation_date.isoformat(),
            location=data.location,
            symptoms=data.symptoms,
            api_key=GEMINI_API_KEY,
            model=GEMINI_MODEL,
            image=data.image.model_dump() if data.image else None,
        )
    except AnalysisServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from None
    saved = Analysis(
        plant_id=plant.id,
        plant_name=plant.name,
        observation_date=data.observation_date,
        location=data.location,
        symptoms=data.symptoms,
        result=json.dumps(result, ensure_ascii=False),
    )
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return saved
