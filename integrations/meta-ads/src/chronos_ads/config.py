"""Single typed boundary for environment settings and maintained content."""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any, Literal
from urllib.parse import urlsplit

from dotenv import dotenv_values
from pydantic import BaseModel, ConfigDict, Field, SecretStr, model_validator

PACKAGE_DATA = Path(__file__).parent / "data"
ENV_PREFIX = "CHRONOS_ADS_"


class Settings(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)
    mode: Literal["offline", "live"] = "offline"
    meta_token: SecretStr = SecretStr("")
    account_id: str = ""
    meta_origin: str = "https://graph.facebook.com"
    api_version: str = ""
    write_enabled: bool = False
    timeout_seconds: float = Field(default=20, gt=0, le=120)
    page_size: int = Field(default=50, ge=1, le=100)
    max_pages: int = Field(default=10, ge=1, le=100)
    max_report_days: int = Field(default=90, ge=1, le=366)
    proposal_ttl_seconds: int = Field(default=3600, ge=1, le=86400)
    database_timeout_seconds: float = Field(default=10, gt=0, le=120)
    state_db: Path = Path("memory/claude-meta-ads/state.sqlite3")
    profile_path: Path = PACKAGE_DATA / "business.json"
    offline_data_path: Path = PACKAGE_DATA / "offline.json"

    @model_validator(mode="after")
    def validate_live(self) -> Settings:
        origin = urlsplit(self.meta_origin)
        if (
            origin.scheme != "https"
            or not origin.hostname
            or origin.username
            or origin.password
            or origin.query
            or origin.fragment
            or origin.path
        ):
            raise ValueError("Meta origin must be an HTTPS origin without path or credentials")
        if self.mode == "live":
            if not self.meta_token.get_secret_value():
                raise ValueError("Live access requires a Meta token")
            if not re.fullmatch(r"act_[0-9]+", self.account_id):
                raise ValueError("Live account ID must have act_ followed by digits")
            if not re.fullmatch(r"v[0-9]+\.[0-9]+", self.api_version):
                raise ValueError("Live access requires an explicit supported Graph API version")
        return self

    @classmethod
    def load(cls, env_file: Path | None = None) -> Settings:
        values: dict[str, Any] = {}
        if env_file is not None:
            if not env_file.is_file():
                raise ValueError("Environment file does not exist")
            values.update(dotenv_values(env_file, interpolate=False))
        values.update(os.environ)
        selected = {
            key.removeprefix(ENV_PREFIX).lower(): value
            for key, value in values.items()
            if key.startswith(ENV_PREFIX)
        }
        for name in ("profile_path", "offline_data_path"):
            if not selected.get(name):
                selected.pop(name, None)
        if env_file:
            for name in ("state_db", "profile_path", "offline_data_path"):
                if name in selected:
                    selected[name] = env_file.resolve().parent / selected[name]
        return cls.model_validate(selected)


class BusinessProfile(BaseModel):
    model_config = ConfigDict(extra="forbid")
    brand: str = Field(min_length=1)
    server_name: str = Field(min_length=1)
    business_status: str
    voice: list[str]
    audiences: list[str]
    positioning: str
    constraints: list[str]
    planning_checklist: list[str]
    operator_instructions: str


def load_profile(settings: Settings) -> BusinessProfile:
    return BusinessProfile.model_validate_json(settings.profile_path.read_text(encoding="utf-8"))
