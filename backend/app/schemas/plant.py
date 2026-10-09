from typing import Annotated, Optional

from pydantic import BaseModel, ConfigDict, StringConstraints

from .common import OptionalText, ShortText


class PlantIn(BaseModel):
    name: ShortText
    plant_type: ShortText
    owner_id: Optional[int] = None
    location: OptionalText = None
    symptoms: Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)] = ""


class PlantOut(PlantIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
