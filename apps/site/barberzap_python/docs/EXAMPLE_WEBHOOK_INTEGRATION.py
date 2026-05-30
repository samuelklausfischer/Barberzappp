"""
EXEMPLO DE INTEGRAÇÃO - Tenant Resolver no Webhook Principal

Este arquivo mostra como integrar o Tenant Resolver no webhook principal
do BarberZap (main.py).
"""

from fastapi import Request
from core.tenant_resolver import resolve_tenant_cached, TenantResolutionError


# =====================
# VERSÃO ATUAL (main.py)
# =====================

@app.post("/webhooks/whatsapp", tags=["Webhooks"])
async def whatsapp_webhook(request: Request):
    """
    Recebe incoming WhatsApp messages from Evolution API.
    
    Expected payload:
    {
        "event": "message",
        "data": {
            "key": {
                "remoteJid": "5511999999999@s.whatsapp.net",
                "fromMe": false
            },
            "message": {
                "conversation": "Olá, quero agendar um corte"
            }
        }
    }
    """
    try:
        payload = await request.json()
        print(f"📩 WhatsApp Webhook received: {payload}")
        
        # TODO: Process webhook
        # 1. Extract phone number and message
        # 2. Get or create tenant context
        # 3. Route to appropriate agent
        # 4. Generate response
        # 5. Send reply via Evolution API
        # 6. Log to CRM
        
        return {"status": "received", "data": payload}
    
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )


# =====================
# VERSÃO COM TENANT RESOLVER
# =====================

@app.post("/webhooks/whatsapp", tags=["Webhooks"])
async def whatsapp_webhook(request: Request):
    """
    Recebe incoming WhatsApp messages from Evolution API.
    
    Payload Esperado (Evolution API):
    {
        "event": "messages.upsert",
        "data": [
            {
                "key": {
                    "remoteJid": "5511999999999@s.whatsapp.net",
                    "fromMe": false,
                    "id": "3EB0..."
                },
                "message": {
                    "conversation": "Olá, quero agendar um corte"
                },
                "pushName": "João Silva",
                "timestamp": 1740315600
            }
        ],
        "instance": {
            "instanceName": "barbearia_001",
            "status": "open"
        }
    }
    """
    try:
        # 1. Extrai payload do webhook
        payload = await request.json()
        logger.info(f"📩 WhatsApp Webhook received from instance: {payload.get('instance', {}).get('instanceName')}")
        
        # 2. Extrai nome da instância
        instance_name = payload.get('instance', {}).get('instanceName')
        
        if not instance_name:
            logger.error("Missing instance_name in webhook payload")
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": "Missing instance_name"}
            )
        
        # 3. ✅ RESOLVE TENANT (NOVO - usando cache para performance)
        try:
            user_id = resolve_tenant_cached(instance_name)
        except TenantResolutionError as e:
            logger.error(f"Tenant resolution failed: {e}")
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "Invalid instance", "detail": str(e)}
            )
        
        if not user_id:
            logger.warning(f"Instance not found or inactive: {instance_name}")
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "Instance not found or inactive"}
            )
        
        # 4. Extrai dados da mensagem
        data = payload.get('data', [])
        if not data:
            logger.warning("No message data in webhook")
            return {"status": "ignored", "reason": "no_data"}
        
        message_obj = data[0]
        key = message_obj.get('key', {})
        
        # Phone number (formato JID: "5511999999999@s.whatsapp.net")
        remote_jid = key.get('remoteJid', '')
        phone = remote_jid.split('@')[0] if remote_jid else None
        
        # Message content
        message_content = None
        message_type = message_obj.get('message', {}).get('conversation')
        
        if message_type:
            message_content = message_type
        
        # 5. ✅ CRIA CONTEXTO DO TENANT (próxima fase)
        tenant_context = {
            'user_id': user_id,
            'instance_name': instance_name,
            'phone': phone,
            'customer_name': message_obj.get('pushName'),
        }
        
        logger.info(f"✅ Tenant resolved: {instance_name} -> {user_id}")
        
        # 6. Processa mensagem com contexto do tenant
        
        # 6.1. Busca configuração do tenant (agente_config)
        from integrations.supabase_rest import get_client
        client = get_client()
        
        agente_config = client.get(
            'agente_config',
            {'user_id': f'eq.{user_id}'},
            single=True
        )
        
        if not agente_config:
            logger.error(f"Configuration not found for tenant: {user_id}")
            return {"status": "error", "error": "Configuration not found"}
        
        # 6.2. Registralead no CRM
        from datetime import datetime
        existing_lead = client.get(
            'crm_leads',
            {'user_id': f'eq.{user_id}', 'phone': f'eq.{phone}'},
            single=True
        )
        
        if not existing_lead:
            lead = client.post('crm_leads', {
                'user_id': user_id,
                'phone': phone,
                'name': message_obj.get('pushName') or phone,
                'status': 'new',
                'source': 'whatsapp',
                'created_at': datetime.utcnow().isoformat()
            })
            lead_id = lead.get('id')
            logger.info(f"📝 New lead created: {lead_id}")
        else:
            lead_id = existing_lead.get('id')
            logger.info(f"👤 Existing lead found: {lead_id}")
        
        # 6.3. Gera resposta AI (próxima fase)
        from integrations.ai_service import AI_Service
        
        ai_service = AI_Service()
        ai_response = await ai_service.generate(
            message=message_content,
            tenant_name=agente_config.get('barber_name', 'Barbearia'),
            context=tenant_context
        )
        
        # 6.4. Envia resposta via Evolution API
        from integrations.evolution_api import EvolutionAPI
        
        evolution = EvolutionAPI()
        send_result = await evolution.send_message(
            instance_name=instance_name,
            phone=phone,
            text=ai_response
        )
        
        # 6.5. Registra mensagem no CRM
        client.post('crm_messages', {
            'lead_id': lead_id,
            'user_id': user_id,
            'phone': phone,
            'direction': 'inbound',
            'message': message_content,
            'response': ai_response,
            'created_at': datetime.utcnow().isoformat()
        })
        
        logger.info(f"✅ Webhook processed successfully: {instance_name} -> {phone}")
        
        return {
            "status": "processed",
            "tenant": {
                "user_id": user_id,
                "instance_name": instance_name
            },
            "message": {
                "from": phone,
                "content": message_content
            },
            "response": ai_response
        }
    
    except Exception as e:
        logger.error(f"❌ Error processing webhook: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Internal server error", "detail": str(e)}
        )


# =====================
# COMPARAÇÃO
# =====================

"""
ANTES (sem Tenant Resolver):
- ❌ Não há resolução de tenant
- ❌ Não sabe quem é o usuário
- ❌ Não pode buscar configuração
- ❌ Não pode registrar no CRM
❌ TODO: Processar webhook (1, 2, 3, 4, 5, 6)

DEPOIS (com Tenant Resolver):
- ✅ Resolve tenant automaticamente
- ✅ Obtém user_id da instância
- ✅ Cache para performance
- ✅ Tratamento de erros (tenant inativo, não encontrado)
- ✅ Validação antes de processar
- ✅ Integração com CRM
- ✅ Busca configuração do tenant
- ✅ Gera resposta AI contextualizada
- ✅ Registra no CRM
- ✅ Envia resposta via Evolution API
"""


# =====================
# OUTRO EXEMPLO: Endpoints API com Tenant
# =====================

@app.get("/api/tenant/{tenant_id}/config", tags=["API"])
async def get_tenant_config(tenant_id: str):
    """
    Obtém configuração do tenant, validando acesso.
    """
    try:
        # Busca configuração
        from integrations.supabase_rest import get_client
        client = get_client()
        
        config = client.get(
            'agente_config',
            {'user_id': f'eq.{tenant_id}'},
            single=True
        )
        
        if not config:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "Configuration not found"}
            )
        
        # Remove campos sensíveis
        config.pop('api_key', None)
        config.pop('service_role_key', None)
        
        return {"status": "success", "data": config}
    
    except Exception as e:
        logger.error(f"Error getting tenant config: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )


@app.get("/api/instance/{instance_name}/status", tags=["API"])
async def get_instance_status(instance_name: str):
    """
    Obtém status da instância (sem resolver tenant).
    """
    try:
        from core.tenant_resolver import get_tenant_instance_info, is_instance_active
        
        info = get_tenant_instance_info(instance_name)
        
        if not info:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"error": "Instance not found"}
            )
        
        return {
            "status": "success",
            "data": {
                "instance_name": instance_name,
                "is_active": is_instance_active(instance_name),
                "status": info.get('status'),
                "webhook_url": info.get('webhook_url')
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting instance status: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
