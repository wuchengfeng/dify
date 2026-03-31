"""Admin control panel API.

Provides endpoints for workspace owners/admins to monitor all users'
workflow editing activity and view LLM node prompt modification history.
"""

import json

from flask import request
from flask_restx import Resource
from sqlalchemy import desc, func, select
from werkzeug.exceptions import NotFound

from controllers.console import console_ns
from controllers.console.wraps import (
    account_initialization_required,
    is_admin_or_owner_required,
    setup_required,
)
from extensions.ext_database import db
from libs.login import current_account_with_tenant, login_required
from models.account import Account
from models.model import App
from models.workflow import Workflow, WorkflowDraftSnapshot

_LLM_NODE_TYPE = "llm"


def _extract_llm_nodes(graph_json: str) -> list[dict]:
    """Return list of LLM nodes from a graph JSON string."""
    try:
        graph = json.loads(graph_json)
    except (json.JSONDecodeError, TypeError):
        return []
    return [
        node
        for node in graph.get("nodes", [])
        if node.get("data", {}).get("type") == _LLM_NODE_TYPE
    ]


def _node_prompt_summary(node: dict) -> dict:
    data = node.get("data", {})
    model_config = data.get("model", {})
    memory = data.get("memory") or {}

    prompt_template = list(data.get("prompt_template") or [])

    # When memory is configured, the user's actual query prompt is stored in
    # memory.query_prompt_template rather than prompt_template.
    query_prompt = memory.get("query_prompt_template")
    if query_prompt:
        prompt_template.append({"role": "user (memory)", "text": query_prompt})

    return {
        "node_id": node.get("id"),
        "node_title": data.get("title", "LLM"),
        "model": model_config.get("name", ""),
        "prompt_template": prompt_template,
    }


@console_ns.route("/control-panel/workflows")
class ControlPanelWorkflowListApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    @is_admin_or_owner_required
    def get(self):
        """List all workflow apps in the current tenant with last edit info."""
        current_user, _ = current_account_with_tenant()
        tenant_id = str(current_user.current_tenant_id)

        # Subquery: latest snapshot per app
        latest_snapshot_sq = (
            select(
                WorkflowDraftSnapshot.app_id,
                func.max(WorkflowDraftSnapshot.created_at).label("last_edited_at"),
                func.count(WorkflowDraftSnapshot.id).label("snapshot_count"),
            )
            .where(WorkflowDraftSnapshot.tenant_id == tenant_id)
            .group_by(WorkflowDraftSnapshot.app_id)
            .subquery()
        )

        # Query apps with workflow mode
        rows = db.session.execute(
            select(
                App.id,
                App.name,
                latest_snapshot_sq.c.last_edited_at,
                latest_snapshot_sq.c.snapshot_count,
            )
            .outerjoin(latest_snapshot_sq, App.id == latest_snapshot_sq.c.app_id)
            .where(App.tenant_id == tenant_id)
            .where(App.mode.in_(["workflow", "advanced-chat"]))
            .order_by(desc(latest_snapshot_sq.c.last_edited_at))
        ).all()

        # Fetch draft workflows to count LLM nodes and get last editor
        app_ids = [str(r.id) for r in rows]
        drafts = {}
        if app_ids:
            draft_rows = db.session.execute(
                select(Workflow.app_id, Workflow.graph, Workflow.updated_by, Workflow.updated_at, Workflow.created_by)
                .where(Workflow.tenant_id == tenant_id)
                .where(Workflow.app_id.in_(app_ids))
                .where(Workflow.version == Workflow.VERSION_DRAFT)
            ).all()
            drafts = {str(d.app_id): d for d in draft_rows}

        # Collect account IDs to resolve names
        editor_ids: set[str] = set()
        for d in drafts.values():
            if d.updated_by:
                editor_ids.add(str(d.updated_by))
            elif d.created_by:
                editor_ids.add(str(d.created_by))

        accounts: dict[str, Account] = {}
        if editor_ids:
            account_rows = db.session.execute(
                select(Account).where(Account.id.in_(editor_ids))
            ).scalars().all()
            accounts = {str(a.id): a for a in account_rows}

        items = []
        for row in rows:
            app_id = str(row.id)
            draft = drafts.get(app_id)
            llm_count = 0
            last_editor_name = None
            last_editor_email = None
            if draft:
                llm_count = len(_extract_llm_nodes(draft.graph or "{}"))
                editor_id = str(draft.updated_by or draft.created_by or "")
                acc = accounts.get(editor_id)
                if acc:
                    last_editor_name = acc.name
                    last_editor_email = acc.email

            items.append({
                "app_id": app_id,
                "app_name": row.name,
                "last_editor_name": last_editor_name,
                "last_editor_email": last_editor_email,
                "last_edited_at": int(row.last_edited_at.timestamp()) if row.last_edited_at else None,
                "llm_node_count": llm_count,
                "snapshot_count": row.snapshot_count or 0,
            })

        return {"items": items}


@console_ns.route("/control-panel/workflows/<string:app_id>/snapshots")
class ControlPanelSnapshotListApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    @is_admin_or_owner_required
    def get(self, app_id: str):
        """List draft snapshots for a workflow app (paginated, newest first)."""
        current_user, _ = current_account_with_tenant()
        tenant_id = str(current_user.current_tenant_id)

        # Verify app belongs to tenant
        app = db.session.execute(
            select(App).where(App.id == app_id).where(App.tenant_id == tenant_id)
        ).scalar_one_or_none()
        if not app:
            raise NotFound("App not found")

        page = max(1, request.args.get("page", 1, type=int))
        limit = min(50, max(1, request.args.get("limit", 20, type=int)))
        offset = (page - 1) * limit

        total = db.session.execute(
            select(func.count(WorkflowDraftSnapshot.id))
            .where(WorkflowDraftSnapshot.app_id == app_id)
            .where(WorkflowDraftSnapshot.tenant_id == tenant_id)
        ).scalar_one()

        snapshot_rows = db.session.execute(
            select(WorkflowDraftSnapshot)
            .where(WorkflowDraftSnapshot.app_id == app_id)
            .where(WorkflowDraftSnapshot.tenant_id == tenant_id)
            .order_by(desc(WorkflowDraftSnapshot.created_at))
            .offset(offset)
            .limit(limit)
        ).scalars().all()

        # Resolve editor names
        editor_ids = {str(s.created_by) for s in snapshot_rows}
        accounts: dict[str, Account] = {}
        if editor_ids:
            account_rows = db.session.execute(
                select(Account).where(Account.id.in_(editor_ids))
            ).scalars().all()
            accounts = {str(a.id): a for a in account_rows}

        items = []
        for snap in snapshot_rows:
            llm_count = len(_extract_llm_nodes(snap.graph))
            acc = accounts.get(str(snap.created_by))
            items.append({
                "id": str(snap.id),
                "created_by_name": acc.name if acc else None,
                "created_by_email": acc.email if acc else None,
                "created_at": int(snap.created_at.timestamp()),
                "llm_node_count": llm_count,
            })

        return {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
        }


@console_ns.route("/control-panel/snapshots/<string:snapshot_id>/llm-nodes")
class ControlPanelSnapshotLLMNodesApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    @is_admin_or_owner_required
    def get(self, snapshot_id: str):
        """Return all LLM nodes and their prompt templates from a snapshot."""
        current_user, _ = current_account_with_tenant()
        tenant_id = str(current_user.current_tenant_id)

        snap = db.session.execute(
            select(WorkflowDraftSnapshot)
            .where(WorkflowDraftSnapshot.id == snapshot_id)
            .where(WorkflowDraftSnapshot.tenant_id == tenant_id)
        ).scalar_one_or_none()
        if not snap:
            raise NotFound("Snapshot not found")

        nodes = [_node_prompt_summary(n) for n in _extract_llm_nodes(snap.graph)]
        return {"nodes": nodes}


@console_ns.route("/control-panel/snapshots/diff")
class ControlPanelSnapshotDiffApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    @is_admin_or_owner_required
    def get(self):
        """Diff LLM node prompts between two snapshots.

        Query params: a=<snapshot_id>, b=<snapshot_id>
        Returns per-node comparison with changed flag.
        """
        current_user, _ = current_account_with_tenant()
        tenant_id = str(current_user.current_tenant_id)

        snapshot_a_id = request.args.get("a")
        snapshot_b_id = request.args.get("b")
        if not snapshot_a_id or not snapshot_b_id:
            return {"error": "Both 'a' and 'b' snapshot IDs are required"}, 400

        snaps = db.session.execute(
            select(WorkflowDraftSnapshot)
            .where(WorkflowDraftSnapshot.id.in_([snapshot_a_id, snapshot_b_id]))
            .where(WorkflowDraftSnapshot.tenant_id == tenant_id)
        ).scalars().all()

        snap_map = {str(s.id): s for s in snaps}
        snap_a = snap_map.get(snapshot_a_id)
        snap_b = snap_map.get(snapshot_b_id)
        if not snap_a or not snap_b:
            raise NotFound("One or both snapshots not found")

        nodes_a = {n["node_id"]: n for n in (_node_prompt_summary(n) for n in _extract_llm_nodes(snap_a.graph))}
        nodes_b = {n["node_id"]: n for n in (_node_prompt_summary(n) for n in _extract_llm_nodes(snap_b.graph))}

        all_node_ids = sorted(set(nodes_a) | set(nodes_b))
        result = []
        for node_id in all_node_ids:
            a = nodes_a.get(node_id)
            b = nodes_b.get(node_id)
            changed = json.dumps(a, sort_keys=True) != json.dumps(b, sort_keys=True)
            result.append({
                "node_id": node_id,
                "node_title": (b or a or {}).get("node_title", "LLM"),
                "changed": changed,
                "snapshot_a": a,
                "snapshot_b": b,
            })

        return {"nodes": result}
