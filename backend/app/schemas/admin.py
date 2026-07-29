from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class FeatureFlagsRequest(BaseModel):
    flags: dict[str, Any]
