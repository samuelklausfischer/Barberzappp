#!/usr/bin/env python3
"""
Supabase-GitHub Integration for Automated Backend Deployment
Integração completa entre Supabase e GitHub para implantação automatizada de repositórios backend
"""

from fastapi import FastAPI, HTTPException, Depends, Header, Request, BackgroundTasks
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import os
import logging
import json
import hmac
import hashlib
import base64
import httpx
import asyncio
from cryptography.fernet import Fernet
from supabase import create_client, Client
import jwt
from enum import Enum

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Supabase-GitHub Integration", version="2.0.0")

# Configurações de ambiente
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE", "")
JWT_SECRET = os.getenv("JWT_SECRET", "")
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "")
WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")

# Inicializa clientes
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
fernet = Fernet(ENCRYPTION_KEY.encode() if ENCRYPTION_KEY else Fernet.generate_key())

# Modelos de dados
class FrameworkType(str, Enum):
    PYTHON = "python"
    NODEJS = "nodejs"
    GO = "go"
    RUST = "rust"
    REACT = "react"
    VUE = "vue"

class DeploymentStatus(str, Enum):
    PENDING = "pending"
    BUILDING = "building"
    DEPLOYING = "deploying"
    RUNNING = "running"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"

class GitHubAuthRequest(BaseModel):
    code: str
    state: str

class DeploymentConfig(BaseModel):
    repository: str
    branch: str = "main"
    framework: FrameworkType
    build_command: Optional[str] = None
    start_command: Optional[str] = None
    environment_variables: Dict[str, str] = {}
    supabase_project_id: str
    enable_automatic_deployments: bool = True

class DeploymentResponse(BaseModel):
    deployment_id: str
    status: DeploymentStatus
    repository: str
    branch: str
    framework: str
    created_at: datetime
    updated_at: datetime
    logs: List[str] = []

# Funções auxiliares
def encrypt_token(token: str) -> str:
    """Criptografa token para armazenamento seguro"""
    return fernet.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    """Descriptografa token"""
    return fernet.decrypt(encrypted_token.encode()).decode()

def generate_jwt_token(user_id: str, github_token: str) -> str:
    """Gera JWT token"""
    payload = {
        "user_id": user_id,
        "github_token": encrypt_token(github_token),
        "exp": datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_jwt_token(token: str) -> Dict[str, Any]:
    """Verifica e decodifica JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        payload["github_token"] = decrypt_token(payload["github_token"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_github_user_data(access_token: str) -> Dict[str, Any]:
    """Obtém dados do usuário GitHub"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {access_token}"}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Erro ao obter dados do GitHub")
        return response.json()

async def get_github_user_repos(access_token: str) -> List[Dict[str, Any]]:
    """Obtém repositórios do usuário"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.github.com/user/repos",
            headers={"Authorization": f"token {access_token}"},
            params={"sort": "updated", "per_page": 100}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Erro ao obter repositórios")
        return response.json()

async def create_github_webhook(access_token: str, repo: str, webhook_url: str) -> str:
    """Cria webhook no repositório GitHub"""
    webhook_config = {
        "name": "web",
        "active": True,
        "events": ["push", "pull_request", "release"],
        "config": {
            "url": webhook_url,
            "content_type": "json",
            "secret": WEBHOOK_SECRET
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.github.com/repos/{repo}/hooks",
            headers={"Authorization": f"token {access_token}"},
            json=webhook_config
        )
        
        if response.status_code == 422 and "Hook already exists" in response.text:
            # Webhook já existe, retorna ID existente
            hooks_response = await client.get(
                f"https://api.github.com/repos/{repo}/hooks",
                headers={"Authorization": f"token {access_token}"}
            )
            hooks = hooks_response.json()
            for hook in hooks:
                if hook["config"]["url"] == webhook_url:
                    return hook["id"]
        
        if response.status_code != 201:
            raise HTTPException(status_code=response.status_code, detail="Erro ao criar webhook")
        
        return response.json()["id"]

async def validate_webhook_signature(payload: bytes, signature: str) -> bool:
    """Valida assinatura do webhook GitHub"""
    if not WEBHOOK_SECRET:
        return True  # Em desenvolvimento, aceita sem assinatura
    
    expected_signature = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(f"sha256={expected_signature}", signature)

# Funções de deploy
async def deploy_python_app(repo: str, branch: str, env_vars: Dict[str, str]) -> str:
    """Deploy aplicação Python"""
    deployment_id = f"python_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    
    # Simula processo de deploy
    await asyncio.sleep(2)
    
    # Cria Dockerfile para Python
    dockerfile_content = f"""
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
"""
    
    # Salva configuração no Supabase
    config = {
        "deployment_id": deployment_id,
        "repository": repo,
        "branch": branch,
        "framework": "python",
        "dockerfile": dockerfile_content,
        "environment_variables": env_vars,
        "status": "deployed",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    supabase.table("deployments").insert(config).execute()
    
    return deployment_id

async def deploy_nodejs_app(repo: str, branch: str, env_vars: Dict[str, str]) -> str:
    """Deploy aplicação Node.js"""
    deployment_id = f"nodejs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    
    # Simula processo de deploy
    await asyncio.sleep(2)
    
    # Cria Dockerfile para Node.js
    dockerfile_content = f"""
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
"""
    
    # Salva configuração no Supabase
    config = {
        "deployment_id": deployment_id,
        "repository": repo,
        "branch": branch,
        "framework": "nodejs",
        "dockerfile": dockerfile_content,
        "environment_variables": env_vars,
        "status": "deployed",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    supabase.table("deployments").insert(config).execute()
    
    return deployment_id

async def deploy_go_app(repo: str, branch: str, env_vars: Dict[str, str]) -> str:
    """Deploy aplicação Go"""
    deployment_id = f"go_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    
    # Simula processo de deploy
    await asyncio.sleep(2)
    
    # Cria Dockerfile para Go
    dockerfile_content = f"""
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o main .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/

COPY --from=builder /app/main .
EXPOSE 8080

CMD ["./main"]
"""
    
    # Salva configuração no Supabase
    config = {
        "deployment_id": deployment_id,
        "repository": repo,
        "branch": branch,
        "framework": "go",
        "dockerfile": dockerfile_content,
        "environment_variables": env_vars,
        "status": "deployed",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    supabase.table("deployments").insert(config).execute()
    
    return deployment_id

# Dependências de autenticação
async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Obtém usuário atual a partir do token JWT"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    scheme, token = authorization.split(' ', 1) if ' ' in authorization else ('', authorization)
    
    if scheme.lower() != 'bearer':
        raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    
    return verify_jwt_token(token)

# Rotas da API
@app.get("/")
async def root():
    """Endpoint raiz"""
    return {
        "service": "Supabase-GitHub Integration",
        "version": "2.0.0",
        "status": "running",
        "endpoints": {
            "auth": "/auth/github",
            "callback": "/auth/github/callback",
            "repos": "/github/repos",
            "deploy": "/deploy",
            "deployments": "/deployments",
            "webhook": "/webhook/github",
            "health": "/health"
        }
    }

@app.get("/auth/github")
async def github_auth():
    """Inicia fluxo de autenticação com GitHub"""
    state = base64.urlsafe_b64encode(os.urandom(32)).decode()
    
    # Salva state no Supabase para validação posterior
    supabase.table("oauth_states").insert({
        "state": state,
        "created_at": datetime.utcnow()
    }).execute()
    
    github_auth_url = (
        f"https://github.com/login/oauth/authorize?"
        f"client_id={GITHUB_CLIENT_ID}&"
        f"redirect_uri={API_BASE_URL}/auth/github/callback&"
        f"scope=repo,user&"
        f"state={state}"
    )
    
    return RedirectResponse(url=github_auth_url)

@app.post("/auth/github/callback")
async def github_callback(request: GitHubAuthRequest):
    """Callback de autenticação GitHub"""
    try:
        # Troca código por token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": GITHUB_CLIENT_ID,
                    "client_secret": GITHUB_CLIENT_SECRET,
                    "code": request.code,
                    "redirect_uri": f"{API_BASE_URL}/auth/github/callback"
                }
            )
            
            if token_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Erro ao obter token do GitHub")
            
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            if not access_token:
                raise HTTPException(status_code=400, detail="Token não recebido")
        
        # Obtém dados do usuário
        user_data = await get_github_user_data(access_token)
        
        # Gera JWT token
        jwt_token = generate_jwt_token(str(user_data["id"]), access_token)
        
        # Salva/Atualiza usuário no Supabase
        user_record = {
            "github_id": str(user_data["id"]),
            "github_username": user_data["login"],
            "github_email": user_data.get("email"),
            "github_token": encrypt_token(access_token),
            "updated_at": datetime.utcnow()
        }
        
        # Verifica se usuário existe
        existing = supabase.table("users").select("id").eq("github_id", str(user_data["id"])).execute()
        
        if existing.data:
            supabase.table("users").update(user_record).eq("github_id", str(user_data["id"])).execute()
        else:
            user_record["created_at"] = datetime.utcnow()
            supabase.table("users").insert(user_record).execute()
        
        # Redireciona para frontend com token
        redirect_url = f"{FRONTEND_URL}/auth/success?token={jwt_token}"
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        logger.error(f"Erro no callback do GitHub: {e}")
        redirect_url = f"{FRONTEND_URL}/auth/error?message={str(e)}"
        return RedirectResponse(url=redirect_url)

@app.get("/github/repos")
async def get_user_repos(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Obtém repositórios do usuário"""
    try:
        repos = await get_github_user_repos(current_user["github_token"])
        
        # Formata resposta
        formatted_repos = []
        for repo in repos:
            formatted_repos.append({
                "id": repo["id"],
                "name": repo["name"],
                "full_name": repo["full_name"],
                "description": repo.get("description"),
                "language": repo.get("language"),
                "stars": repo["stargazers_count"],
                "forks": repo["forks_count"],
                "updated_at": repo["updated_at"],
                "private": repo["private"],
                "has_webhook": False  # Verificar se tem webhook depois
            })
        
        return {
            "total": len(formatted_repos),
            "repositories": formatted_repos
        }
        
    except Exception as e:
        logger.error(f"Erro ao obter repositórios: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao obter repositórios: {str(e)}")

@app.post("/deploy")
async def create_deployment(
    config: DeploymentConfig,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Cria nova implantação"""
    try:
        deployment_id = f"deploy_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        # Cria registro no banco
        deployment_record = {
            "deployment_id": deployment_id,
            "user_id": current_user["user_id"],
            "repository": config.repository,
            "branch": config.branch,
            "framework": config.framework.value,
            "status": DeploymentStatus.PENDING.value,
            "environment_variables": json.dumps(config.environment_variables),
            "supabase_project_id": config.supabase_project_id,
            "enable_automatic_deployments": config.enable_automatic_deployments,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        supabase.table("deployments").insert(deployment_record).execute()
        
        # Cria webhook no GitHub
        webhook_url = f"{API_BASE_URL}/webhook/github"
        try:
            webhook_id = await create_github_webhook(current_user["github_token"], config.repository, webhook_url)
            supabase.table("deployments").update({"github_webhook_id": webhook_id}).eq("deployment_id", deployment_id).execute()
        except Exception as e:
            logger.warning(f"Não foi possível criar webhook: {e}")
        
        # Inicia processo de deploy em background
        background_tasks.add_task(process_deployment, deployment_id, config, current_user)
        
        return {
            "deployment_id": deployment_id,
            "status": DeploymentStatus.PENDING.value,
            "message": "Implantação iniciada com sucesso"
        }
        
    except Exception as e:
        logger.error(f"Erro ao criar implantação: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar implantação: {str(e)}")

async def process_deployment(deployment_id: str, config: DeploymentConfig, user: Dict[str, Any]):
    """Processa implantação em background"""
    try:
        # Atualiza status
        supabase.table("deployments").update({
            "status": DeploymentStatus.BUILDING.value,
            "updated_at": datetime.utcnow()
        }).eq("deployment_id", deployment_id).execute()
        
        # Adiciona log
        add_deployment_log(deployment_id, "Iniciando processo de build...")
        
        # Prepara variáveis de ambiente com dados do Supabase
        env_vars = config.environment_variables.copy()
        env_vars["SUPABASE_URL"] = SUPABASE_URL
        env_vars["SUPABASE_KEY"] = SUPABASE_KEY
        env_vars["DEPLOYMENT_ID"] = deployment_id
        
        # Executa deploy baseado no framework
        if config.framework == FrameworkType.PYTHON:
            deployed_id = await deploy_python_app(config.repository, config.branch, env_vars)
        elif config.framework == FrameworkType.NODEJS:
            deployed_id = await deploy_nodejs_app(config.repository, config.branch, env_vars)
        elif config.framework == FrameworkType.GO:
            deployed_id = await deploy_go_app(config.repository, config.branch, env_vars)
        else:
            raise ValueError(f"Framework não suportado: {config.framework}")
        
        # Atualiza status final
        supabase.table("deployments").update({
            "status": DeploymentStatus.RUNNING.value,
            "deployed_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }).eq("deployment_id", deployment_id).execute()
        
        add_deployment_log(deployment_id, "Implantação concluída com sucesso!")
        
    except Exception as e:
        logger.error(f"Erro no processo de deploy: {e}")
        supabase.table("deployments").update({
            "status": DeploymentStatus.FAILED.value,
            "error_message": str(e),
            "updated_at": datetime.utcnow()
        }).eq("deployment_id", deployment_id).execute()
        
        add_deployment_log(deployment_id, f"Erro na implantação: {str(e)}")

def add_deployment_log(deployment_id: str, message: str):
    """Adiciona log de deployment"""
    log_entry = {
        "deployment_id": deployment_id,
        "message": message,
        "timestamp": datetime.utcnow()
    }
    supabase.table("deployment_logs").insert(log_entry).execute()

@app.get("/deployments")
async def list_deployments(
    current_user: Dict[str, Any] = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0
):
    """Lista implantações do usuário"""
    try:
        result = supabase.table("deployments").select("*").eq("user_id", current_user["user_id"]).order("created_at", desc=True).limit(limit).offset(offset).execute()
        
        deployments = []
        for dep in result.data:
            deployments.append({
                "deployment_id": dep["deployment_id"],
                "repository": dep["repository"],
                "branch": dep["branch"],
                "framework": dep["framework"],
                "status": dep["status"],
                "created_at": dep["created_at"],
                "updated_at": dep["updated_at"],
                "deployed_at": dep.get("deployed_at"),
                "error_message": dep.get("error_message")
            })
        
        return {
            "total": len(deployments),
            "deployments": deployments
        }
        
    except Exception as e:
        logger.error(f"Erro ao listar implantações: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar implantações: {str(e)}")

@app.get("/deployments/{deployment_id}")
async def get_deployment(deployment_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Obtém detalhes de uma implantação"""
    try:
        result = supabase.table("deployments").select("*").eq("deployment_id", deployment_id).eq("user_id", current_user["user_id"]).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Implantação não encontrada")
        
        deployment = result.data[0]
        
        # Obtém logs
        logs_result = supabase.table("deployment_logs").select("*").eq("deployment_id", deployment_id).order("timestamp").execute()
        
        return {
            "deployment": deployment,
            "logs": logs_result.data if logs_result.data else []
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter implantação: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao obter implantação: {str(e)}")

@app.post("/deployments/{deployment_id}/rollback")
async def rollback_deployment(deployment_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Executa rollback de uma implantação"""
    try:
        # Obtém implantação atual
        result = supabase.table("deployments").select("*").eq("deployment_id", deployment_id).eq("user_id", current_user["user_id"]).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Implantação não encontrada")
        
        deployment = result.data[0]
        
        if deployment["status"] != DeploymentStatus.RUNNING.value:
            raise HTTPException(status_code=400, detail="Apenas implantações em execução podem ser revertidas")
        
        # Atualiza status
        supabase.table("deployments").update({
            "status": DeploymentStatus.ROLLED_BACK.value,
            "rolled_back_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }).eq("deployment_id", deployment_id).execute()
        
        add_deployment_log(deployment_id, "Rollback executado com sucesso")
        
        return {
            "message": "Rollback executado com sucesso",
            "deployment_id": deployment_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao executar rollback: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao executar rollback: {str(e)}")

@app.post("/webhook/github")
async def github_webhook(request: Request):
    """Recebe webhooks do GitHub"""
    try:
        # Obtém assinatura do header
        signature = request.headers.get("X-Hub-Signature-256")
        event_type = request.headers.get("X-GitHub-Event")
        
        # Lê payload
        payload = await request.body()
        
        # Valida assinatura
        if not await validate_webhook_signature(payload, signature or ""):
            raise HTTPException(status_code=401, detail="Assinatura inválida")
        
        # Processa evento
        data = json.loads(payload)
        
        if event_type == "push":
            await handle_push_event(data)
        elif event_type == "pull_request":
            await handle_pull_request_event(data)
        elif event_type == "release":
            await handle_release_event(data)
        
        return {"message": "Webhook processado com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao processar webhook: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar webhook: {str(e)}")

async def handle_push_event(data: Dict[str, Any]):
    """Processa evento de push"""
    repository = data["repository"]["full_name"]
    branch = data["ref"].replace("refs/heads/", "")
    
    # Busca implantações ativas para este repositório/branch
    result = supabase.table("deployments").select("*").eq("repository", repository).eq("branch", branch).eq("enable_automatic_deployments", True).eq("status", DeploymentStatus.RUNNING.value).execute()
    
    if result.data:
        for deployment in result.data:
            # Atualiza status e inicia novo deploy
            supabase.table("deployments").update({
                "status": DeploymentStatus.PENDING.value,
                "updated_at": datetime.utcnow()
            }).eq("deployment_id", deployment["deployment_id"]).execute()
            
            add_deployment_log(deployment["deployment_id"], f"Push detectado em {branch}, iniciando novo deploy...")

async def handle_pull_request_event(data: Dict[str, Any]):
    """Processa evento de pull request"""
    action = data["action"]
    if action == "closed" and data["pull_request"]["merged"]:
        # PR foi mergeado, pode iniciar deploy
        logger.info("Pull request mergeado detectado")

async def handle_release_event(data: Dict[str, Any]):
    """Processa evento de release"""
    action = data["action"]
    if action == "published":
        # Nova release publicada
        logger.info("Nova release detectada")

@app.get("/health")
async def health_check():
    """Health check do serviço"""
    try:
        # Testa conexão com Supabase
        result = supabase.table("users").select("id").limit(1).execute()
        
        return {
            "status": "healthy",
            "service": "supabase-github-integration",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected",
            "github_integration": "active"
        }
        
    except Exception as e:
        logger.error(f"Health check falhou: {e}")
        return {
            "status": "unhealthy",
            "service": "supabase-github-integration",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "disconnected",
            "error": str(e)
        }

# Middleware para logging
@app.middleware("http")
async def log_requests(request, call_next):
    start_time = datetime.utcnow()
    response = await call_next(request)
    process_time = (datetime.utcnow() - start_time).total_seconds()
    
    logger.info(
        f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s"
    )
    
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)