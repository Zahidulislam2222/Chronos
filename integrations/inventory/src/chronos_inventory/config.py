"""One configuration boundary; deployment values come from the environment."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

from dotenv import dotenv_values
from pydantic import BaseModel, ConfigDict, Field, SecretStr, model_validator


class Settings(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, hide_input_in_errors=True)
    token: SecretStr
    database: Path
    bind_host: str
    port: int = Field(ge=1, le=65535)
    request_timeout: float = Field(gt=0)
    body_limit: int = Field(gt=0)
    batch_limit: int = Field(gt=0)
    gallery_limit: int = Field(gt=0)
    currency: str = Field(pattern=r"^[A-Z]{3}$")
    source_namespace: str = Field(pattern=r"^[a-z0-9-]{1,40}$")
    available_statuses: list[str]
    image_hosts: list[str]
    woo_origin: str
    source_api_path: str
    source_page_size: int = Field(ge=1, le=100)
    source_page_limit: int = Field(ge=1)
    source_excluded_ids: list[int]

    @model_validator(mode="after")
    def validate_configuration(self) -> Settings:
        if len(self.token.get_secret_value()) < 24:
            raise ValueError("Configure a strong inventory authentication token")
        if not self.source_api_path.startswith("/") or ".." in self.source_api_path:
            raise ValueError("Invalid product API path")
        if self.woo_origin:
            url = urlsplit(self.woo_origin)
            if (
                url.scheme != "https"
                or not url.hostname
                or url.username
                or url.password
                or url.path not in {"", "/"}
                or url.query
                or url.fragment
            ):
                raise ValueError("WooCommerce requires an HTTPS origin")
        return self

    @classmethod
    def load(cls, env_file: Path | None = None) -> Settings:
        values = {**(dotenv_values(env_file) if env_file else {}), **os.environ}
        prefix = "CHRONOS_INVENTORY_"
        data: dict[str, Any] = {
            key.removeprefix(prefix).lower(): value
            for key, value in values.items()
            if key.startswith(prefix)
        }
        for name in ("image_hosts", "available_statuses"):
            if isinstance(data.get(name), str):
                data[name] = [v.strip() for v in str(data[name]).split(",") if v.strip()]
        if isinstance(data.get("source_excluded_ids"), str):
            raw = str(data["source_excluded_ids"])
            data["source_excluded_ids"] = [int(v) for v in raw.split(",") if v.strip()]
        return cls.model_validate(data)
