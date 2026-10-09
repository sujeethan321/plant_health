import json
import base64
import binascii
from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import ConfigDict, BaseModel, Field, StringConstraints, model_validator, field_validator, ValidationError



MAX_IMAGE_BYTES = 5 * 1024 * 1024


class AnalysisImage(BaseModel):
    mime_type: Literal["image/jpeg", "image/png", "image/webp"]
    data: str = Field(min_length=1, max_length=4 * ((MAX_IMAGE_BYTES + 2) // 3))

    @model_validator(mode="after")
    def validate_image(self):
        try:
            raw = base64.b64decode(self.data, validate=True)
        except (ValueError, binascii.Error):
            raise ValueError("Image data must be valid base64.") from None
        if not raw or len(raw) > MAX_IMAGE_BYTES:
            raise ValueError("Choose an image up to 5 MB.")
        valid = {
            "image/jpeg": raw.startswith(b"\xff\xd8\xff"),
            "image/png": raw.startswith(b"\x89PNG\r\n\x1a\n"),
            "image/webp": raw.startswith(b"RIFF") and raw[8:12] == b"WEBP",
        }
        if not valid[self.mime_type]:
            raise ValueError("The file must match its JPEG, PNG, or WebP image type.")
        return self


class AnalysisIn(BaseModel):
    plant_id: int = Field(gt=0)
    observation_date: date
    location: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
    symptoms: Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)] = ""
    image: AnalysisImage | None = None

    @model_validator(mode="after")
    def require_observation(self):
        if not self.symptoms and self.image is None:
            raise ValueError("Describe symptoms or upload a plant image.")
        return self


class PlantAIResult(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    possible_issue: str = Field(min_length=1)
    explanation: str = Field(min_length=1)
    care_suggestions: list[str] = Field(min_length=1)
    expert_advice_needed: bool

    @field_validator("possible_issue", "explanation")
    @classmethod
    def nonblank_text(cls, value):
        if not value.strip():
            raise ValueError("Assessment text must not be blank.")
        return value.strip()

    @field_validator("care_suggestions")
    @classmethod
    def nonblank_suggestions(cls, value):
        if any(not item.strip() for item in value):
            raise ValueError("Care suggestions must not be blank.")
        return [item.strip() for item in value]


def parse_ai_result(value):
    if not value:
        return None
    try:
        decoded = json.loads(value) if isinstance(value, str) else value
        return PlantAIResult.model_validate(decoded)
    except (json.JSONDecodeError, ValidationError, TypeError):
        return None


class AnalysisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    plant_id: int
    plant_name: str
    observation_date: date
    location: str
    symptoms: str
    ai_result: PlantAIResult | None = Field(default=None, validation_alias="result")

    @field_validator("ai_result", mode="before")
    @classmethod
    def decode_saved_result(cls, value):
        return parse_ai_result(value)
