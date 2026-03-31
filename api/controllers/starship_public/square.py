"""Public (unauthenticated) Starship square endpoints."""

from flask import request
from flask_restx import Resource
from sqlalchemy import desc, func, select

from controllers.starship_public import starship_public_ns
from extensions.ext_database import db
from models.account import Account
from models.model import App


@starship_public_ns.route("/square")
class PublicStarshipSquareApi(Resource):
    def get(self):
        """List all public starship agents (no login required).

        Query params: search, page, limit, tenant_id (required to scope results)
        """
        tenant_id = request.args.get("tenant_id", "").strip()
        if not tenant_id:
            return {"error": "tenant_id is required"}, 400

        page = max(1, request.args.get("page", 1, type=int))
        limit = min(48, max(1, request.args.get("limit", 24, type=int)))
        search = request.args.get("search", "").strip()[:50]

        query = (
            select(App)
            .where(App.tenant_id == tenant_id)
            .where(App.is_public == True)
            .where(App.enable_site == True)
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
            accs = db.session.execute(
                select(Account).where(Account.id.in_(creator_ids))
            ).scalars().all()
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
