import os
from functools import wraps
from flask import request
from flask_restx import Resource
from werkzeug.exceptions import Unauthorized, NotFound
import json

from extensions.ext_database import db
from models.account import Account, Tenant
from models.model import App, AppMode
from services.app_service import AppService
from controllers.inner_api import inner_api_ns

def ag_inner_api_only(view):
    @wraps(view)
    def decorated(*args, **kwargs):
        secret = request.headers.get("X-Ag-Auth-Secret")
        expected_secret = os.environ.get("AG_AUTH_SECRET", "ag_dev_secret_key_2026")
        if not secret or secret != expected_secret:
            raise Unauthorized("Invalid AG_AUTH_SECRET")
        return view(*args, **kwargs)
    return decorated

def get_system_admin_account_and_tenant():
    # Fetch the first active account and tenant
    # Since this is an internal API orchestrating Dify, we use the root admin
    tenant = db.session.query(Tenant).first()
    if not tenant:
        raise NotFound("No active tenant found in Dify")
    account = db.session.query(Account).first()
    if not account:
        raise NotFound("No active account found in Dify")
    return account, tenant

@inner_api_ns.route("/ag_starship/apps/sync")
class AgStarshipAppSync(Resource):
    @ag_inner_api_only
    def post(self):
        data = request.json or {}
        dify_app_id = data.get("dify_app_id")
        name = data.get("name", "Untitled Agent")
        description = data.get("description", "")
        pre_prompt = data.get("pre_prompt", "")
        
        account, tenant = get_system_admin_account_and_tenant()
        app_service = AppService()

        # Tools mapping
        tool_settings = data.get("tool_settings", {})
        tools = []
        if tool_settings.get("web_search"):
            tools.append({
                "provider_type": "builtin",
                "provider_id": "google",
                "tool_name": "google_search",
                "tool_parameters": {}
            })
            
        agent_mode_dict = {
            "strategy": "function_calling",
            "tools": tools
        }

        if not dify_app_id:
            # Create a new app (Agent Chat)
            args = {
                "name": name,
                "description": description,
                "mode": AppMode.AGENT_CHAT.value,
                "icon_type": "emoji",
                "icon": "🤖",
                "icon_background": "#FFEAD5"
            }
            app = app_service.create_app(tenant.id, args, account)
            dify_app_id = app.id

            # Update its model config with our prompt and tools
            if app.app_model_config:
                app.app_model_config.pre_prompt = pre_prompt
                app.app_model_config.agent_mode = json.dumps(agent_mode_dict)
                db.session.commit()
                
            return {"dify_app_id": dify_app_id, "status": "created"}
        else:
            # Update existing app
            app = db.session.query(App).filter(App.id == dify_app_id).first()
            if not app:
                raise NotFound(f"App {dify_app_id} not found")
                
            app.name = name
            app.description = description
            db.session.commit()

            if app.app_model_config:
                app.app_model_config.pre_prompt = pre_prompt
                app.app_model_config.agent_mode = json.dumps(agent_mode_dict)
                db.session.commit()
                
            return {"dify_app_id": dify_app_id, "status": "updated"}

@inner_api_ns.route("/ag_starship/apps/<uuid:app_id>/chat")
class AgStarshipAppChat(Resource):
    @ag_inner_api_only
    def post(self, app_id):
        # We will use ChatService to run the agent
        data = request.json or {}
        query = data.get("query")
        user_id = data.get("user_id", "marsedu_student")
        
        # Implement Chat Service
        from services.app_generate_service import AppGenerateService
        from core.app.entities.app_invoke_entities import InvokeFrom
        from models.model import App
        from libs import helper
        
        app_id_str = str(app_id)
        app_model = db.session.query(App).filter(App.id == app_id_str).first()
        if not app_model:
            raise NotFound("App not found")
            
        account, tenant = get_system_admin_account_and_tenant()

        # Build args for generation
        args = {
            "query": query,
            "inputs": {},
            "model_config": {},
            "response_mode": "blocking",
            "auto_generate_name": False
        }

        try:
            response = AppGenerateService.generate(
                app_model=app_model,
                user=account,
                args=args,
                invoke_from=InvokeFrom.DEBUGGER,
                streaming=False
            )
            result = helper.compact_generate_response(response)
            
            # The result from compact_generate_response might be a dict with answer/text
            answer = result.get("answer", "")
            return {"answer": answer}
        except Exception as e:
            return {"error": str(e), "answer": "测试期间发生错误: " + str(e)}, 500

@inner_api_ns.route("/ag_starship/apps/<uuid:app_id>/upload_knowledge")
class AgStarshipAppUploadKnowledge(Resource):
    @ag_inner_api_only
    def post(self, app_id):
        from services.file_service import FileService
        from services.dataset_service import DatasetService, DocumentService
        from services.entities.knowledge_entities.knowledge_entities import KnowledgeConfig
        from werkzeug.datastructures import FileStorage
        import json

        app_id_str = str(app_id)
        app_model = db.session.query(App).filter(App.id == app_id_str).first()
        if not app_model:
            raise NotFound("App not found")

        account, tenant = get_system_admin_account_and_tenant()

        # 1. Upload File
        if 'file' not in request.files:
            return {"error": "No file uploaded"}, 400
        
        file = request.files['file']
        if not file.filename:
            return {"error": "Empty filename"}, 400
            
        file_content = file.read()
        mimetype = file.mimetype
        
        upload_file = FileService().upload_file(
            filename=file.filename,
            content=file_content,
            mimetype=mimetype,
            user=account,
            source="datasets"
        )
        
        # 2. Check if App has Dataset
        dataset = None
        if app_model.app_model_config and app_model.app_model_config.dataset_configs:
            try:
                # Need to use dictionary directly if dataset_configs is dict or parse if string
                dataset_configs = app_model.app_model_config.dataset_configs_dict
                datasets_list = dataset_configs.get("datasets", {}).get("datasets", [])
                if datasets_list:
                    dataset_id = datasets_list[0].get("dataset", {}).get("id")
                    if dataset_id:
                        dataset = DatasetService.get_dataset(dataset_id)
            except Exception:
                pass
                
        # 3. Create Dataset if not exists
        if not dataset:
            dataset_name = f"Starship_{app_model.name}_{app_id_str[:8]}"
            dataset = DatasetService.create_empty_dataset(
                tenant_id=tenant.id,
                name=dataset_name,
                description=f"Auto-generated knowledge base for {app_model.name}",
                indexing_technique="economy",
                account=account,
                permission="only_me",
                provider="vendor"
            )
            
            # Bind Dataset to App
            new_dataset_configs = {
                "retrieval_model": "multiple",
                "datasets": {
                    "datasets": [
                        {"dataset": {"id": dataset.id, "enabled": True}}
                    ]
                }
            }
            if app_model.app_model_config:
                app_model.app_model_config.dataset_configs = json.dumps(new_dataset_configs)
                db.session.commit()
                
        # 4. Bind document
        knowledge_config_data = {
            "indexing_technique": "economy",
            "data_source": {
                "info_list": {
                    "data_source_type": "upload_file",
                    "file_info_list": {
                        "file_ids": [upload_file.id]
                    }
                }
            },
            "process_rule": {
                "mode": "automatic"
            }
        }
        knowledge_config = KnowledgeConfig.model_validate(knowledge_config_data)
        
        DocumentService.save_document_with_dataset_id(
            dataset=dataset,
            knowledge_config=knowledge_config,
            account=account
        )
        return {
            "data": {
                "document_id": upload_file.id,
                "name": upload_file.name,
            }
        }

