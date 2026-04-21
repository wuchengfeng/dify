from flask import Blueprint
from flask_restx import Api, Namespace

bp = Blueprint("starship_public", __name__, url_prefix="/starship-public")

api = Api(
    bp,
    version="1.0",
    title="Starship Public API",
    description="Unauthenticated endpoints for the Starship agent square.",
)

starship_public_ns = Namespace("starship_public", description="Public Starship API", path="/")
api.add_namespace(starship_public_ns)

from . import square

REGISTERED_ROUTE_MODULES = (square,)
