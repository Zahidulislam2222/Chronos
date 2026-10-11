"""Immutable Meta protocol field selections and constrained mutation schema."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ACCOUNT_FIELDS = "id,name,currency,timezone_name"
CAMPAIGN_FIELDS = "id,name,status,effective_status,objective,account_id"
INSIGHT_FIELDS = "campaign_id,campaign_name,date_start,date_stop,spend,impressions,clicks"
PAUSED_STATUS = "PAUSED"
AWARENESS_OBJECTIVE = "OUTCOME_AWARENESS"


class Campaign(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(pattern=r"^[0-9]+$")
    name: str
    status: str
    effective_status: str
    objective: str
    account_id: str = Field(pattern=r"^[0-9]+$")


class Account(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(pattern=r"^act_[0-9]+$")
    name: str
    currency: str = Field(pattern=r"^[A-Z]{3}$")
    timezone_name: str


class Change(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)
    operation: Literal["create_paused_campaign", "pause_campaign"]
    name: str = Field(default="", max_length=200)
    campaign_id: str = Field(default="", pattern=r"^[0-9]*$")
