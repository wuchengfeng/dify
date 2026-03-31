"""Starship — student AI agent creation platform models."""

from datetime import datetime
from enum import StrEnum
from uuid import uuid4

from sqlalchemy import DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from libs.datetime_utils import naive_utc_now

from .base import Base
from .types import LongText, StringUUID


class StarshipRole(StrEnum):
    COACH = "coach"
    STUDENT = "student"


class StarshipAgentVersionStatus(StrEnum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"


class StarshipGroupMemberRole(StrEnum):
    LEADER = "leader"
    MEMBER = "member"


class StarshipMember(Base):
    """Maps a Dify account to a starship role (coach or student) within a tenant."""

    __tablename__ = "starship_members"
    __table_args__ = (
        UniqueConstraint("tenant_id", "account_id", name="uq_starship_member_tenant_account"),
    )

    id: Mapped[str] = mapped_column(StringUUID, primary_key=True, default=lambda: str(uuid4()))
    tenant_id: Mapped[str] = mapped_column(StringUUID, nullable=False, index=True)
    account_id: Mapped[str] = mapped_column(StringUUID, nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)  # StarshipRole
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=naive_utc_now)


class StarshipAgentVersion(Base):
    """A submitted version of a student's agent, with coach review state."""

    __tablename__ = "starship_agent_versions"
    __table_args__ = (
        Index("sav_app_version_idx", "app_id", "version_number"),
    )

    id: Mapped[str] = mapped_column(StringUUID, primary_key=True, default=lambda: str(uuid4()))
    tenant_id: Mapped[str] = mapped_column(StringUUID, nullable=False, index=True)
    app_id: Mapped[str] = mapped_column(StringUUID, nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Snapshot of agent config at submission time
    agent_config_snapshot: Mapped[str] = mapped_column(LongText, nullable=False, default="{}")

    status: Mapped[str] = mapped_column(String(32), nullable=False, default=StarshipAgentVersionStatus.DRAFT)

    submitted_by: Mapped[str | None] = mapped_column(StringUUID, nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    reviewed_by: Mapped[str | None] = mapped_column(StringUUID, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    review_comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=naive_utc_now)


class StarshipGroup(Base):
    """A student group that can collaboratively own agents."""

    __tablename__ = "starship_groups"

    id: Mapped[str] = mapped_column(StringUUID, primary_key=True, default=lambda: str(uuid4()))
    tenant_id: Mapped[str] = mapped_column(StringUUID, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_by: Mapped[str] = mapped_column(StringUUID, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=naive_utc_now)


class StarshipGroupMember(Base):
    """Membership of an account in a starship group."""

    __tablename__ = "starship_group_members"
    __table_args__ = (
        UniqueConstraint("group_id", "account_id", name="uq_starship_group_member"),
    )

    id: Mapped[str] = mapped_column(StringUUID, primary_key=True, default=lambda: str(uuid4()))
    group_id: Mapped[str] = mapped_column(StringUUID, nullable=False, index=True)
    account_id: Mapped[str] = mapped_column(StringUUID, nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default=StarshipGroupMemberRole.MEMBER)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=naive_utc_now)


class StarshipGroupAgent(Base):
    """Association between a group and a Dify App (agent)."""

    __tablename__ = "starship_group_agents"
    __table_args__ = (
        UniqueConstraint("group_id", "app_id", name="uq_starship_group_agent"),
    )

    id: Mapped[str] = mapped_column(StringUUID, primary_key=True, default=lambda: str(uuid4()))
    group_id: Mapped[str] = mapped_column(StringUUID, nullable=False, index=True)
    app_id: Mapped[str] = mapped_column(StringUUID, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=naive_utc_now)
