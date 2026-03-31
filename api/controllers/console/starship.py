"""Starship console API.

Provides authenticated endpoints for student agent creation, version
submission and coach review within the Starship learning platform.
"""

import json

from flask import request
from flask_restx import Resource
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, select
from werkzeug.exceptions import Forbidden, NotFound

from controllers.console import console_ns
from controllers.console.wraps import (
    account_initialization_required,
    is_admin_or_owner_required,
    setup_required,
)
from extensions.ext_database import db
from libs.datetime_utils import naive_utc_now
from libs.login import current_account_with_tenant, login_required
from models.account import Account
from models.model import App
from models.starship import (
    StarshipAgentVersion,
    StarshipAgentVersionStatus,
    StarshipGroup,
    StarshipGroupAgent,
    StarshipGroupMember,
    StarshipGroupMemberRole,
    StarshipMember,
    StarshipRole,
)
from services.app_dsl_service import AppDslService
from services.app_service import AppService

# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------


def _get_starship_role(tenant_id: str, account_id: str) -> str | None:
    member = db.session.execute(
        select(StarshipMember)
        .where(StarshipMember.tenant_id == tenant_id)
        .where(StarshipMember.account_id == account_id)
    ).scalar_one_or_none()
    return member.role if member else None


def _require_coach(tenant_id: str, account_id: str) -> None:
    role = _get_starship_role(tenant_id, account_id)
    if role != StarshipRole.COACH:
        raise Forbidden("Coach role required")


def _app_belongs_to_tenant(app_id: str, tenant_id: str) -> App:
    app = db.session.execute(
        select(App).where(App.id == app_id).where(App.tenant_id == tenant_id)
    ).scalar_one_or_none()
    if not app:
        raise NotFound("App not found")
    return app


# ---------------------------------------------------------------------------
# Member management (owner/admin only)
# ---------------------------------------------------------------------------

class AssignMemberPayload(BaseModel):
    account_id: str = Field(...)
    role: str = Field(...)  # "coach" | "student"


@console_ns.route("/starship/members")
class StarshipMemberListApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    @is_admin_or_owner_required
    def get(self):
        """List all starship members in the current tenant."""
        current_user, _ = current_account_with_tenant()
        tenant_id = str(current_user.current_tenant_id)

        rows = db.session.execute(
            select(StarshipMember).where(StarshipMember.tenant_id == tenant_id)
        ).scalars().all()

        account_ids = {str(m.account_id) for m in rows}
        accounts: dict[str, Account] = {}
        if account_ids:
            accs = db.session.execute(
                select(Account).where(Account.id.in_(account_ids))
            ).scalars().all()
            accounts = {str(a.id): a for a in accs}

        return {
            "items": [
                {
                    "id": str(m.id),
                    "account_id": str(m.account_id),
                    "name": accounts.get(str(m.account_id), Account()).name if str(m.account_id) in accounts else None,
                    "email": accounts[str(m.account_id)].email if str(m.account_id) in accounts else None,
                    "role": m.role,
                }
                for m in rows
            ]
        }

    @setup_required
    @login_required
    @account_initialization_required
    @is_admin_or_owner_required
    def post(self):
        """Assign or update a starship role for an account."""
        current_user, _ = current_account_with_tenant()
        tenant_id = str(current_user.current_tenant_id)
        payload = AssignMemberPayload.model_validate(request.get_json())

        if payload.role not in (StarshipRole.COACH, StarshipRole.STUDENT):
            return {"error": "role must be 'coach' or 'student'"}, 400

        existing = db.session.execute(
            select(StarshipMember)
            .where(StarshipMember.tenant_id == tenant_id)
            .where(StarshipMember.account_id == payload.account_id)
        ).scalar_one_or_none()

        if existing:
            existing.role = payload.role
        else:
            db.session.add(StarshipMember(
                tenant_id=tenant_id,
                account_id=payload.account_id,
                role=payload.role,
            ))
        db.session.commit()
        return {"result": "ok"}


@console_ns.route("/starship/members/<string:account_id>")
class StarshipMemberDeleteApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    @is_admin_or_owner_required
    def delete(self, account_id: str):
        current_user, _ = current_account_with_tenant()
        tenant_id = str(current_user.current_tenant_id)
        db.session.execute(
            db.session.query(StarshipMember)
            .filter_by(tenant_id=tenant_id, account_id=account_id)
            .statement
        )
        db.session.query(StarshipMember).filter_by(
            tenant_id=tenant_id, account_id=account_id
        ).delete()
        db.session.commit()
        return {"result": "ok"}


# ---------------------------------------------------------------------------
# Agent (student) APIs
# ---------------------------------------------------------------------------

class CreateAgentPayload(BaseModel):
    name: str = Field(...)
    description: str = Field(default="")
    icon: str = Field(default="🤖")
    icon_background: str = Field(default="#FFEAD5")
    pre_prompt: str = Field(default="")


@console_ns.route("/starship/agents")
class StarshipAgentListApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def get(self):
        """List the current user's starship agents."""
        current_user, _ = current_account_with_tenant()
        tenant_id = str(current_user.current_tenant_id)

        apps = db.session.execute(
            select(App)
            .where(App.tenant_id == tenant_id)
            .where(App.mode == "agent-chat")
            .where(App.created_by == current_user.id)
            .order_by(desc(App.created_at))
        ).scalars().all()

        return {
            "items": [
                {
                    "id": str(a.id),
                    "name": a.name,
                    "description": a.description,
                    "icon": a.icon,
                    "icon_background": a.icon_background,
                    "is_public": a.is_public,
                    "created_at": int(a.created_at.timestamp()),
                }
                for a in apps
            ]
        }

    @setup_required
    @login_required
    @account_initialization_required
    def post(self):
        """Create a new starship agent (Dify App in agent-chat mode)."""
        current_user, _ = current_account_with_tenant()
        tenant_id = str(current_user.current_tenant_id)
        payload = CreateAgentPayload.model_validate(request.get_json())

        app = AppService().create_app(
            tenant_id=tenant_id,
            args={
                "name": payload.name,
                "description": payload.description,
                "icon_type": "emoji",
                "icon": payload.icon,
                "icon_background": payload.icon_background,
                "mode": "agent-chat",
            },
            account=current_user,
        )

        # Update pre_prompt if provided
        if payload.pre_prompt and app.app_model_config:
            config = app.app_model_config
            config.pre_prompt = payload.pre_prompt
            db.session.commit()

        return {
            "id": str(app.id),
            "name": app.name,
            "description": app.description,
            "icon": app.icon,
        }, 201


# ---------------------------------------------------------------------------
# Version submission
# ---------------------------------------------------------------------------

@console_ns.route("/starship/agents/<string:app_id>/submit")
class StarshipAgentSubmitApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def post(self, app_id: str):
        """Student submits current agent config as a new version for coach review."""
        current_user, _ = current_account_with_tenant()
        tenant_id = str(current_user.current_tenant_id)

        app = _app_belongs_to_tenant(app_id, tenant_id)
        if str(app.created_by) != str(current_user.id):
            raise Forbidden("You can only submit your own agents")

        # Calculate next version number
        max_version = db.session.execute(
            select(func.max(StarshipAgentVersion.version_number))
            .where(StarshipAgentVersion.app_id == app_id)
        ).scalar_one() or 0

        # Snapshot current agent config
        snapshot: dict = {
            "name": app.name,
            "description": app.description,
            "pre_prompt": app.app_model_config.pre_prompt if app.app_model_config else "",
            "agent_mode": app.app_model_config.agent_mode_dict if app.app_model_config else {},
        }

        version = StarshipAgentVersion(
            tenant_id=tenant_id,
            app_id=app_id,
            version_number=max_version + 1,
            agent_config_snapshot=json.dumps(snapshot),
            status=StarshipAgentVersionStatus.SUBMITTED,
            submitted_by=str(current_user.id),
            submitted_at=naive_utc_now(),
        )
        db.session.add(version)
        db.session.commit()

        return {"id": str(version.id), "version_number": version.version_number}, 201


@console_ns.route("/starship/agents/<string:app_id>/versions")
class StarshipAgentVersionListApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def get(self, app_id: str):
        """List all submitted versions of an agent with review status."""
        current_user, _ = current_account_with_tenant()
        tenant_id = str(current_user.current_tenant_id)
        _app_belongs_to_tenant(app_id, tenant_id)

        versions = db.session.execute(
            select(StarshipAgentVersion)
            .where(StarshipAgentVersion.app_id == app_id)
            .order_by(desc(StarshipAgentVersion.version_number))
        ).scalars().all()

        # Resolve account names
        ids = {str(v.submitted_by) for v in versions if v.submitted_by}
        ids |= {str(v.reviewed_by) for v in versions if v.reviewed_by}
        accounts: dict[str, Account] = {}
        if ids:
            accs = db.session.execute(select(Account).where(Account.id.in_(ids))).scalars().all()
            accounts = {str(a.id): a for a in accs}

        return {
            "items": [
                {
                    "id": str(v.id),
                    "version_number": v.version_number,
                    "status": v.status,
                    "submitted_by_name": (
                        accounts[str(v.submitted_by)].name
                        if v.submitted_by and str(v.submitted_by) in accounts
                        else None
                    ),
                    "submitted_at": int(v.submitted_at.timestamp()) if v.submitted_at else None,
                    "reviewed_by_name": (
                        accounts[str(v.reviewed_by)].name
                        if v.reviewed_by and str(v.reviewed_by) in accounts
                        else None
                    ),
                    "reviewed_at": int(v.reviewed_at.timestamp()) if v.reviewed_at else None,
                    "review_comment": v.review_comment,
                    "agent_config": json.loads(v.agent_config_snapshot),
                }
                for v in versions
            ]
        }


# ---------------------------------------------------------------------------
# Coach dashboard
# ---------------------------------------------------------------------------

@console_ns.route("/starship/coach/pending")
class StarshipCoachPendingApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def get(self):
        """Coach views all pending (submitted) versions across the tenant."""
        current_user, _ = current_account_with_tenant()
        tenant_id = str(current_user.current_tenant_id)
        _require_coach(tenant_id, str(current_user.id))

        versions = db.session.execute(
            select(StarshipAgentVersion)
            .where(StarshipAgentVersion.tenant_id == tenant_id)
            .where(StarshipAgentVersion.status == StarshipAgentVersionStatus.SUBMITTED)
            .order_by(StarshipAgentVersion.submitted_at)
        ).scalars().all()

        app_ids = {str(v.app_id) for v in versions}
        apps: dict[str, App] = {}
        if app_ids:
            app_rows = db.session.execute(select(App).where(App.id.in_(app_ids))).scalars().all()
            apps = {str(a.id): a for a in app_rows}

        submitter_ids = {str(v.submitted_by) for v in versions if v.submitted_by}
        accounts: dict[str, Account] = {}
        if submitter_ids:
            accs = db.session.execute(select(Account).where(Account.id.in_(submitter_ids))).scalars().all()
            accounts = {str(a.id): a for a in accs}

        return {
            "items": [
                {
                    "id": str(v.id),
                    "app_id": str(v.app_id),
                    "app_name": apps[str(v.app_id)].name if str(v.app_id) in apps else None,
                    "version_number": v.version_number,
                    "submitted_by_name": (
                        accounts[str(v.submitted_by)].name
                        if v.submitted_by and str(v.submitted_by) in accounts
                        else None
                    ),
                    "submitted_at": int(v.submitted_at.timestamp()) if v.submitted_at else None,
                    "agent_config": json.loads(v.agent_config_snapshot),
                }
                for v in versions
            ]
        }


class ReviewPayload(BaseModel):
    action: str = Field(...)  # "approve" | "reject"
    comment: str = Field(default="")


@console_ns.route("/starship/versions/<string:version_id>/review")
class StarshipVersionReviewApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def post(self, version_id: str):
        """Coach approves or rejects a submitted version."""
        current_user, _ = current_account_with_tenant()
        tenant_id = str(current_user.current_tenant_id)
        _require_coach(tenant_id, str(current_user.id))

        payload = ReviewPayload.model_validate(request.get_json())
        if payload.action not in ("approve", "reject"):
            return {"error": "action must be 'approve' or 'reject'"}, 400

        version = db.session.execute(
            select(StarshipAgentVersion)
            .where(StarshipAgentVersion.id == version_id)
            .where(StarshipAgentVersion.tenant_id == tenant_id)
        ).scalar_one_or_none()
        if not version:
            raise NotFound("Version not found")

        new_status = (
            StarshipAgentVersionStatus.APPROVED
            if payload.action == "approve"
            else StarshipAgentVersionStatus.REJECTED
        )
        version.status = new_status
        version.reviewed_by = str(current_user.id)
        version.reviewed_at = naive_utc_now()
        version.review_comment = payload.comment

        # If approved, make the app public and enable site
        if new_status == StarshipAgentVersionStatus.APPROVED:
            app = db.session.execute(
                select(App).where(App.id == version.app_id)
            ).scalar_one_or_none()
            if app:
                app.is_public = True
                app.enable_site = True

        db.session.commit()
        return {"result": "ok", "status": new_status}


# ---------------------------------------------------------------------------
# Public square (still requires login to read tenant context)
# ---------------------------------------------------------------------------

@console_ns.route("/starship/square")
class StarshipSquareApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def get(self):
        """List approved (public) starship agents in current tenant."""
        current_user, _ = current_account_with_tenant()
        tenant_id = str(current_user.current_tenant_id)

        page = max(1, request.args.get("page", 1, type=int))
        limit = min(48, max(1, request.args.get("limit", 24, type=int)))
        search = request.args.get("search", "").strip()[:50]

        query = (
            select(App)
            .where(App.tenant_id == tenant_id)
            .where(App.is_public == True)
            .where(App.mode == "agent-chat")
        )
        if search:
            query = query.where(App.name.ilike(f"%{search}%"))

        total = db.session.execute(
            select(func.count()).select_from(query.subquery())
        ).scalar_one()

        apps = db.session.execute(
            query.order_by(desc(App.updated_at))
            .offset((page - 1) * limit)
            .limit(limit)
        ).scalars().all()

        creator_ids = {str(a.created_by) for a in apps if a.created_by}
        accounts: dict[str, Account] = {}
        if creator_ids:
            accs = db.session.execute(select(Account).where(Account.id.in_(creator_ids))).scalars().all()
            accounts = {str(a.id): a for a in accs}

        return {
            "items": [
                {
                    "id": str(a.id),
                    "name": a.name,
                    "description": a.description,
                    "icon": a.icon,
                    "icon_background": a.icon_background,
                    "creator_name": (
                        accounts[str(a.created_by)].name
                        if a.created_by and str(a.created_by) in accounts
                        else None
                    ),
                    "site_code": a.site.code if a.site else None,
                    "updated_at": int(a.updated_at.timestamp()),
                }
                for a in apps
            ],
            "total": total,
            "page": page,
            "limit": limit,
        }


# ---------------------------------------------------------------------------
# Groups
# ---------------------------------------------------------------------------

class CreateGroupPayload(BaseModel):
    name: str = Field(...)
    description: str = Field(default="")
    member_ids: list[str] = Field(default_factory=list)


@console_ns.route("/starship/groups")
class StarshipGroupListApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def get(self):
        current_user, _ = current_account_with_tenant()
        tenant_id = str(current_user.current_tenant_id)

        # My groups (as member or creator)
        my_group_ids_row = db.session.execute(
            select(StarshipGroupMember.group_id)
            .where(StarshipGroupMember.account_id == str(current_user.id))
        ).scalars().all()

        groups = db.session.execute(
            select(StarshipGroup)
            .where(StarshipGroup.tenant_id == tenant_id)
            .where(StarshipGroup.id.in_(my_group_ids_row))
        ).scalars().all()

        return {
            "items": [
                {
                    "id": str(g.id),
                    "name": g.name,
                    "description": g.description,
                    "created_at": int(g.created_at.timestamp()),
                }
                for g in groups
            ]
        }

    @setup_required
    @login_required
    @account_initialization_required
    def post(self):
        current_user, _ = current_account_with_tenant()
        tenant_id = str(current_user.current_tenant_id)
        payload = CreateGroupPayload.model_validate(request.get_json())

        group = StarshipGroup(
            tenant_id=tenant_id,
            name=payload.name,
            description=payload.description,
            created_by=str(current_user.id),
        )
        db.session.add(group)
        db.session.flush()

        # Add creator as leader
        db.session.add(StarshipGroupMember(
            group_id=str(group.id),
            account_id=str(current_user.id),
            role=StarshipGroupMemberRole.LEADER,
        ))
        # Add other members
        for mid in payload.member_ids:
            db.session.add(StarshipGroupMember(
                group_id=str(group.id),
                account_id=mid,
                role=StarshipGroupMemberRole.MEMBER,
            ))

        db.session.commit()
        return {"id": str(group.id), "name": group.name}, 201


@console_ns.route("/starship/groups/<string:group_id>/agents")
class StarshipGroupAgentListApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def get(self, group_id: str):
        current_user, _ = current_account_with_tenant()
        agent_links = db.session.execute(
            select(StarshipGroupAgent).where(StarshipGroupAgent.group_id == group_id)
        ).scalars().all()
        app_ids = [str(link.app_id) for link in agent_links]
        apps = db.session.execute(select(App).where(App.id.in_(app_ids))).scalars().all() if app_ids else []
        return {
            "items": [
                {"id": str(a.id), "name": a.name, "icon": a.icon, "is_public": a.is_public}
                for a in apps
            ]
        }

    @setup_required
    @login_required
    @account_initialization_required
    def post(self, group_id: str):
        current_user, _ = current_account_with_tenant()
        data = request.get_json()
        app_id = data.get("app_id")
        if not app_id:
            return {"error": "app_id required"}, 400
        db.session.add(StarshipGroupAgent(group_id=group_id, app_id=app_id))
        db.session.commit()
        return {"result": "ok"}, 201


@console_ns.route("/starship/groups/<string:group_id>/fork")
class StarshipGroupForkApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def post(self, group_id: str):
        """Fork a group agent to the current user's personal agents."""
        current_user, _ = current_account_with_tenant()
        tenant_id = str(current_user.current_tenant_id)
        data = request.get_json()
        app_id = data.get("app_id")
        if not app_id:
            return {"error": "app_id required"}, 400

        source_app = _app_belongs_to_tenant(app_id, tenant_id)

        # Reuse Dify's DSL export/import to fork
        dsl = AppDslService.export_dsl(source_app, include_secret=False)
        new_app = AppDslService.import_app(
            tenant_id=tenant_id,
            app_data=dsl,
            args={
                "name": f"{source_app.name} (Fork)",
                "description": source_app.description,
                "icon_type": source_app.icon_type or "emoji",
                "icon": source_app.icon,
                "icon_background": source_app.icon_background,
            },
            account=current_user,
        )
        return {"id": str(new_app.id), "name": new_app.name}, 201
