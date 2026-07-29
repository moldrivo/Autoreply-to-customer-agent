from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class ConnectPlatformRequest(BaseModel):
    platform: str = Field(..., min_length=1, max_length=50)
    credentials: dict[str, Any] = Field(default_factory=dict)
