# Tenant Resolver - Guia de Uso

## Visão Geral

O `Tenant Resolver` é o componente responsável por traduzir nomes de instâncias Evolution API em IDs de usuário (tenants) do BarberZap.

## Tabela `whatsapp_instances`

### Estrutura

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | int | Chave primária |
| `instance_name` | varchar | Nome único da instância Evolution API |
| `user_id` | varchar | ID do usuário/tenant (FK) |
| `status` | varchar | Status: `active`, `inactive`, `suspended` |
| `api_key` | varchar | Chave de API (opcional) |
| `webhook_url` | varchar | URL do webhook (opcional) |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |

### Exemplo de Dados

```json
{
  "id": 1,
  "instance_name": "barbearia_001",
  "user_id": "12345",
  "status": "active",
  "api_key": "evp_xxxxx",
  "webhook_url": "https://api.evolution.com/webhook/inst_001",
  "created_at": "2026-02-23T12:00:00Z",
  "updated_at": "2026-02-23T12:00:00Z"
}
```

## Instalação

Já incluído no projeto em: `/barberzap_python/core/tenant_resolver.py`

## Importação

```python
# Importação direta do módulo
from core.tenant_resolver import resolve_tenant, resolve_tenant_safe

# Importação do pacote core
from core import resolve_tenant, resolve_tenant_safe
```

## Casos de Uso

### 1. Webhook do WhatsApp (Principal)

Ao receber um webhook do Evolution API, o payload contém `instanceName`:

```python
from fastapi import Request
from core import resolve_tenant

@app.post("/webhooks/whatsapp")
async def whatsapp_webhook(request: Request):
    payload = await request.json()
    
    # Extrai nome da instância do webhook
    instance_name = payload.get('instanceName')  # ou payload.get('instance')
    
    # Resolve o tenant
    user_id = resolve_tenant(instance_name)
    
    if not user_id:
        return {"error": "Invalid instance"}
    
    # Continua processamento com user_id
    # ...
```

### 2. Versão Safe (Sem Exceções)

Para handlers de webhook onde você não quer levantar exceções:

```python
from core import resolve_tenant_safe

@app.post("/webhooks/whatsapp")
async def whatsapp_webhook(request: Request):
    payload = await request.json()
    instance_name = payload.get('instanceName')
    
    # Retorna None em caso de erro (não levanta exceção)
    user_id = resolve_tenant_safe(instance_name)
    
    if user_id is None:
        return {"error": "Tenant not found or inactive"}
    
    # Continua processamento
    # ...
```

### 3. Alta Performance (com Cache)

Para webhooks com alta frequência, use a versão com cache:

```python
from core import resolve_tenant_cached

@app.post("/webhooks/whatsapp")
async def whatsapp_webhook(request: Request):
    payload = await request.json()
    instance_name = payload.get('instanceName')
    
    # Cache LRU automático (últimas 128 entradas)
    user_id = resolve_tenant_cached(instance_name)
    
    if not user_id:
        return {"error": "Invalid instance"}
    
    # As próximas consultas da mesma instância não buscam no banco
    # ...
```

### 4. Validação Cross-Tenant

Para garantir que uma operação não acesse dados de outro tenant:

```python
from core import validate_tenant_access

def send_message(user_id: str, instance_name: str, message: str):
    # Verifica se a instância pertence ao tenant
    if not validate_tenant_access(instance_name, user_id):
        raise PermissionError("Access denied: instance does not belong to tenant")
    
    # Continua com o envio
    # ...
```

### 5. Listar Instâncias de um Tenant

Para dashboard ou UI administrativa:

```python
from core import list_tenant_instances

def get_user_instances(user_id: str):
    # Lista todas as instâncias ativas de um usuário
    instances = list_tenant_instances(user_id, active_only=True)
    
    return {
        "user_id": user_id,
        "total": len(instances),
        "instances": instances
    }
```

### 6. Verificar Status da Instância

```python
from core import is_instance_active, get_tenant_instance_info

def check_instance_status(instance_name: str):
    # Verifica se está ativa
    if not is_instance_active(instance_name):
        return {"status": "not active"}
    
    # Obtém informações detalhadas
    info = get_tenant_instance_info(instance_name)
    
    return info
```

## Funções Disponíveis

### `resolve_tenant(instance_name: str, check_active: bool = True) -> Optional[str]`

Resolve o tenant ID a partir do nome da instância.

**Parâmetros:**
- `instance_name`: Nome da instância Evolution API
- `check_active`: Se True, retorna None se o tenant estiver inativo

**Retorna:**
- `user_id` do tenant (str) se encontrado
- `None` se não encontrado

**Exceções:**
- `TenantNotFoundError`: Instância não encontrada
- `TenantInactiveError`: Tenant está inativo (quando `check_active=True`)
- `TenantResolutionError`: Erro genérico de resolução

**Exemplo:**
```python
user_id = resolve_tenant("barbearia_001")
# Retorna: "12345"

user_id = resolve_tenant("inst_inativa", check_active=True)
# Levanta: TenantInactiveError
```

---

### `resolve_tenant_safe(instance_name: str) -> Optional[str]`

Versão segura que não levanta exceções.

**Parâmetros:**
- `instance_name`: Nome da instância Evolution API

**Retorna:**
- `user_id` do tenant se encontrado
- `None` caso contrário (erros são logados mas não levantados)

**Exemplo:**
```python
user_id = resolve_tenant_safe("barbearia_001")
# Retorna: "12345"

user_id = resolve_tenant_safe("inst_inativa")
# Retorna: None (loga erro)
```

---

### `resolve_tenant_cached(instance_name: str) -> Optional[str]`

Versão com cache LRU para alto desempenho.

**Parâmetros:**
- `instance_name`: Nome da instância Evolution API

**Retorna:**
- `user_id` do tenant se encontrado
- `None` caso contrário

**Note:**
- Cache tem máximo de 128 entradas
- Cache pode ser limpo com: `resolve_tenant_cached.cache_clear()`

**Exemplo:**
```python
# Primeira chamada - busca no banco
user_id = resolve_tenant_cached("barbearia_001")

# Segunda chamada - usa cache (sem consulta ao banco)
user_id = resolve_tenant_cached("barbearia_001")
```

---

### `get_tenant_instance_info(instance_name: str, user_id: Optional[str] = None) -> Optional[dict]`

Obtém informações completas da instância.

**Parâmetros:**
- `instance_name`: Nome da instância Evolution API
- `user_id`: (opcional) ID do usuário para filtrar por tenant

**Retorna:**
- Dicionário com informações da instância
- `None` se não encontrada

**Exemplo:**
```python
info = get_tenant_instance_info("barbearia_001")
# Retorna: {
#     'id': 1,
#     'instance_name': 'barbearia_001',
#     'user_id': '12345',
#     'status': 'active',
#     'api_key': 'xxx',
#     'webhook_url': 'https://...'
# }
```

---

### `is_instance_active(instance_name: str) -> bool`

Verifica se uma instância está ativa.

**Parâmetros:**
- `instance_name`: Nome da instância Evolution API

**Retorna:**
- `True` se ativa
- `False` caso contrário

**Exemplo:**
```python
if is_instance_active("barbearia_001"):
    send_message("barbearia_001", "Olá!")
```

---

### `list_tenant_instances(user_id: str, active_only: bool = True) -> list`

Lista todas as instâncias de um tenant.

**Parâmetros:**
- `user_id`: ID do usuário/tenant
- `active_only`: Se True, retorna apenas instâncias ativas

**Retorna:**
- Lista de dicionários com informações das instâncias

**Exemplo:**
```python
instances = list_tenant_instances("12345")
# Retorna: [
#     {'instance_name': 'barbearia_001', 'status': 'active'},
#     {'instance_name': 'barbearia_002', 'status': 'active'}
# ]
```

---

### `validate_tenant_access(instance_name: str, expected_user_id: str) -> bool`

Valida se uma instância pertence ao tenant especificado.

**Parâmetros:**
- `instance_name`: Nome da instância Evolution API
- `expected_user_id`: ID do usuário esperado

**Retorna:**
- `True` se a instância pertence ao tenant
- `False` caso contrário

**Exemplo:**
```python
def delete_instance(user_id: str, instance_name: str):
    if not validate_tenant_access(instance_name, user_id):
        raise PermissionError("Access denied")
    
    # Continua com deleção
```

## Exceções

### `TenantResolutionError`

Erro base para operações de resolução de tenant.

### `TenantNotFoundError`

Instância não encontrada no banco de dados.

### `TenantInactiveError`

Tenant está inativo (quando `check_active=True`).

## Benchmarks

Otimizações implementadas:

| Operação | Primeira Chamada | Chamada em Cache |
|----------|-----------------|------------------|
| `resolve_tenant` | ~100ms | - |
| `resolve_tenant_cached` | ~100ms | ~1ms |
| `resolve_tenant_safe` | ~100ms | - |

## Melhores Práticas

### 1. Use `resolve_tenant_cached` em Webhooks

Webhooks podem receber múltiplas mensagens seguidas da mesma instância. Use a versão com cache:

```python
from core import resolve_tenant_cached

@app.post("/webhooks/whatsapp")
async def webhook(request: Request):
    payload = await request.json()
    user_id = resolve_tenant_cached(payload['instanceName'])
    ...
```

### 2. Use `resolve_tenant_safe` em Handlers Produtivos

Em produção, use a versão safe para evitar que exceções interrompam o processo:

```python
from core import resolve_tenant_safe

user_id = resolve_tenant_safe(instance_name)
if user_id is None:
    log_error("Tenant not found")
    return
```

### 3. Valide Acesso em Operações Cross-Tenant

Sempre valide o acesso em operações sensíveis:

```python
from core import validate_tenant_access

def update_config(user_id: str, instance_name: str, config: dict):
    if not validate_tenant_access(instance_name, user_id):
        raise PermissionError("Access denied")
    ...
```

### 4. Limpe Cache Periodicamente

Em aplicações long-running, limpe o cache periodicamente:

```python
import asyncio

async def cache_cleanup():
    while True:
        await asyncio.sleep(3600)  # A cada hora
        resolve_tenant_cached.cache_clear()
```

## Exemplo Completo: Webhook com Tenant Resolver

```python
from fastapi import FastAPI, Request
from core import resolve_tenant_cached
from integrations.supabase_rest import get_client

app = FastAPI()

@app.post("/webhooks/whatsapp")
async def whatsapp_webhook(request: Request):
    # 1. Extrai payload do webhook
    payload = await request.json()
    
    # 2. Extrai informações relevantes
    instance_name = payload.get('instanceName')
    message = payload.get('message', {}).get('conversation', '')
    phone = payload.get('key', {}).get('remoteJid', '').split('@')[0]
    
    if not instance_name:
        return {"error": "Missing instance_name"}
    
    try:
        # 3. Resolve tenant (com cache para performance)
        user_id = resolve_tenant_cached(instance_name)
        
        if not user_id:
            return {"error": "Invalid instance"}
        
        # 4. Busca configuração do tenant
        client = get_client()
        config = client.get('agente_config', {'user_id': f'eq.{user_id}'}, single=True)
        
        if not config:
            return {"error": "Configuration not found"}
        
        # 5. Processa mensagem (por exemplo, AI)
        from integrations.ai_service import AI_Service
        ai_service = AI_Service()
        ai_response = await ai_service.generate(
            message=message,
            tenant_name=config.get('barber_name', 'Barbearia')
        )
        
        # 6. Envia resposta via Evolution API
        from integrations.evolution_api import EvolutionAPI
        evolution = EvolutionAPI()
        await evolution.send_message(
            instance_name=instance_name,
            phone=phone,
            text=ai_response
        )
        
        # 7. Loga no CRM
        client.post('crm_messages', {
            'user_id': user_id,
            'phone': phone,
            'message': message,
            'response': ai_response,
            'direction': 'inbound'
        })
        
        return {"status": "processed"}
        
    except Exception as e:
        return {"error": str(e)}
```

## Suporte

Para dúvidas ou problemas, verifique:
- Logs em `/path/to/barberzap_python/logs/`
- Testes em `tests/test_tenant_resolver.py`
- Documentação do Supabase em `/docs/SUPABASE_WRAPPER_DELIVERY.md`
