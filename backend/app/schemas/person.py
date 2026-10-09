from pydantic import BaseModel, ConfigDict

from .common import OptionalText, ShortText


class PersonIn(BaseModel):
    name: ShortText
    email: OptionalText = None
    phone: OptionalText = None


class PersonOut(PersonIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
