from typing import Annotated, Optional

from pydantic import StringConstraints


ShortText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
LongText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]
OptionalText = Optional[Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)]]
