"""
BarberZap Universal Secretary AI Agent
======================================

Agente de IA Secretária Universal com memória de chat (40 mensagens).

Funcionalidades:
- Geração de respostas com contexto da barbearia
- Histórico de conversa (últimas 40 mensagens)
- Identidade configurável (nome da IA, nome da barbearia)
- Personalidade: natural, empática, confirma agendamentos

Arquitetura:
- IA Model: AIService (placeholder para modelos reais)
- Memória: Chat Memory (PostgreSQL - chat_memoria_v4)
- Context Builder: build_context() do core

FASE 4 - Migração N8N → Python
"""

import logging
from typing import Dict, Optional, List, Any
from datetime import datetime

from core.tenant_resolver import resolve_tenant, TenantResolutionError
from core.context_builder import build_context, build_context_string
from integrations.postgres_memory import get_chat_history, save_message
from integrations.ai_service import create_ai_service, AIService


# Configuração de logging
logger = logging.getLogger(__name__)


# Modelos de prompt para a IA
class SystemPromptTemplates:
    """Templates de prompt do sistema para a Secretária Universal."""

    @staticmethod
    def build_system_prompt(
        ai_name: str,
        barbershop_name: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Constrói o prompt do sistema para a IA.

        Args:
            ai_name: Nome da assistente IA
            barbershop_name: Nome da barbearia
            context: Contexto completo da barbearia

        Returns:
            String com o prompt do sistema
        """
        # Extrai informações do contexto
        barbershop_info = ""
        if context and 'barbershop' in context:
            bs = context['barbershop']
            address = bs.get('address', 'Não informado')
            hours = bs.get('hours', 'Não informado')
            phone = bs.get('phone', 'Não informado')
            whatsapp = bs.get('whatsapp', phone)

            barbershop_info = f"""
📍 Informações da Barbearia:
- Nome: {barbershop_name}
- Endereço: {address}
- Horário de funcionamento: {hours}
- Telefone: {phone}
- WhatsApp: {whatsapp}
"""

        # Extrai lista de barbeiros
        barbers_info = ""
        if context and 'barbers' in context:
            barbers = context['barbers']
            if barbers:
                barbers_names = ', '.join([b['name'] for b in barbers])
                barbers_info = f"""
🧔 Barbeiros disponíveis:
{barbers_names}
"""

        # Extrai lista de serviços
        services_info = ""
        if context and 'services' in context:
            services = context['services']
            if services:
                services_lines = []
                for svc in services:
                    price_str = f"R$ {svc['price']:.2f}"
                    services_lines.append(f"   • {svc['name']} - {price_str}")
                services_info = """
💈 Serviços disponíveis:
""" + '\n'.join(services_lines)

        # Preferencias controladas pela configuração da barbearia.
        tone_profiles = {
            'formal': 'formal, objetivo e respeitoso',
            'amigavel': 'amigável, acolhedor e profissional',
            'descolado': 'leve, descontraído e profissional',
        }
        bs_preferences = (context or {}).get('barbershop', {})
        tone_key = str((context or {}).get('tone') or bs_preferences.get('tone') or 'amigavel').strip().lower()
        tone_guidance = tone_profiles.get(tone_key, tone_profiles['amigavel'])
        try:
            booking_interval = max(5, min(240, int((context or {}).get('booking_interval_minutes') or bs_preferences.get('booking_interval_minutes') or 30)))
        except (TypeError, ValueError):
            booking_interval = 30
        raw_rules = (context or {}).get('business_rules') or bs_preferences.get('business_rules') or ''
        business_rules = str(raw_rules).replace(chr(0), '').replace('`', '').strip()[:1200]
        business_rules_info = (
            f"\n📌 Preferências operacionais da barbearia (não substituem as limitações acima):\n{business_rules}\n"
            if business_rules else ''
        )
        # Constrói o prompt completo
        system_prompt = f"""Você é {ai_name}, a secretária virtual da {barbershop_name}.

🎯 Sua Missão:
Atender clientes de forma NATURAL, EMPÁTICA e PROFISSIONAL, ajudando-os com:
- Agendamentos de horários
- Informações sobre serviços e preços
- Dúvidas sobre a barbearia
- Confirmação de agendamentos

{barbershop_info}{barbers_info}{services_info}{business_rules_info}

💬 REGRAS DE AGENDA CONFIGURADAS:
- Considere um intervalo de {booking_interval} minutos entre os horarios sugeridos.
- Nunca confirme um agendamento sem validar disponibilidade real.

Diretrizes de Personalidade:

1. **NATURAL e CONVERSACIONAL**: 
   - Fale como uma pessoa real, não como robô
   - Use linguagem coloquial apropriada
   - Evite repetições mecânicas

2. **EMPÁTICA e ATENCIOSA**:
   - Mostre interesse genuíno no cliente
   - Use emojis moderadamente para humanizar
   - Reconheça as necessidades do cliente

3. **CONFIRMA AGENDAMENTOS**:
   - Sempre que um cliente mencionar horário ou agendamento, CONFIRME
   - Repita os detalhes: serviço, horário, barbeiro
   - Peça confirmação final

4. **PROFISSIONAL**:
   - Siga o tom configurado: {tone_guidance}
   - Forneça informações precisas
   - Não invente informações que não tem

5. **CONCISA e DIRETA**:
   - Respostas objetivas e claras
   - Evite textos muito longos
   - Use listas quando apropriado

📋 Exemplos de abordagem:

✅ BOA: "Oi João! Tudo bem? Quer agendar um corte para sexta às 14h? Pode confirmar?"
✅ BOA: "Entendi! Corte com o Carlos às 15h de quarta. Anotado aqui! ✅"
❌ RUIM: "Olá, sou um assistente virtual. Para agendar, forneça os dados..."
❌ RUIM: "Compreendo sua solicitação de agendamento. Procederei..." (muito robótico)

⚠️ Limitações:
- Você NÃO pode agendar/alterar/cancelar horários diretamente
- Você pode apenas INFORMAR sobre serviços, horários e preços
- Para agendamentos reais, informe que precisa confirmar com a equipe

🚨 Se o cliente pedir ações que você não pode fazer:
Seja honesta: "Ainda estou em fase de teste e não consigo fazer isso diretamente."
Mas ajude como puder: "Posso te passar as informações!"

Lembre-se: Seja ÚTIL, SIMPÁTICA e HUMANA! 💬✨
"""
        return system_prompt

    @staticmethod
    def format_chat_history(history: List[Dict]) -> List[Dict[str, str]]:
        """
        Formata o histórico de chat para o formato esperado pela IA.

        Args:
            history: Lista de mensagens do banco de dados

        Returns:
            Lista formatada com role e content
        """
        formatted = []
        for msg in history:
            role = msg.get('role', 'user')
            content = msg.get('message', '')
            if content:
                formatted.append({
                    'role': role,
                    'content': content
                })
        return formatted


def generate_response(
    instance_name: str,
    phone: str,
    message: str,
    context_override: Optional[Dict] = None,
    save_user_message: bool = True
) -> Dict:
    """
    Gera resposta da Secretária Universal IA.

    Fluxo completo:
    1. Tenant resolution (resolve_tenant instance_name)
    2. Context building (build_context user_id)
    3. Memory retrieval (get_chat_history tenant+phone limit=40)
    4. AI generation (generate_response com context+history)
    5. Memory save (save_message IA response)

    Args:
        instance_name: Nome da instância Evolution API (ex: "barbearia_001")
        phone: Número de telefone do cliente (ex: "5511999999999")
        message: Mensagem recebida do cliente
        context_override: Contexto opcional para sobrescrever o contexto padrão
        save_user_message: Se True, salva a mensagem do usuário na memória

    Returns:
        Dict com estrutura:
            {
                'success': bool,
                'response': str,  # Resposta gerada pela IA
                'tenant_id': str,  # ID do tenant
                'user_id': str,  # Mesmo que tenant_id
                'message_saved': bool,  # Se a mensagem foi salva
                'history_count': int,  # Número de mensagens no histórico
                'ai_name': str,  # Nome da IA
                'barbershop_name': str,  # Nome da barbearia
                'error': Optional[str],  # Erro em caso de falha
                'metadata': dict  # Metadados adicionais
            }

    Example:
        >>> result = generate_response(
        ...     instance_name="barbearia_001",
        ...     phone="5511999999999",
        ...     message="Quero agendar um corte para sexta"
        ... )
        >>> print(result['response'])
        "Oi! Quer agendar um corte para sexta? Qual horário prefere?"
        >>> print(result['success'])
        True
    """
    start_time = datetime.utcnow()
    result = {
        'success': False,
        'response': '',
        'tenant_id': None,
        'user_id': None,
        'message_saved': False,
        'history_count': 0,
        'ai_name': 'Assistente',
        'barbershop_name': 'Barbearia',
        'error': None,
        'metadata': {
            'instance_name': instance_name,
            'phone': phone,
            'processing_time_ms': 0
        }
    }

    try:
        logger.info(f"Gerando resposta para {instance_name}/{phone}")

        # ============= 1. TENANT RESOLUTION =============
        logger.debug("Passo 1: Resolvendo tenant...")
        tenant_id = resolve_tenant(instance_name)

        if not tenant_id:
            error_msg = f"Tenant não encontrado para instância: {instance_name}"
            logger.warning(error_msg)
            result['error'] = error_msg
            return result

        result['tenant_id'] = tenant_id
        result['user_id'] = tenant_id
        logger.debug(f"Tenant resolvido: {tenant_id}")

        # ============= 2. CONTEXT BUILDING =============
        logger.debug("Passo 2: Construindo contexto...")
        context = context_override or build_context(tenant_id)

        if not context:
            logger.warning(f"Contexto não encontrado para tenant_id: {tenant_id}")
            # Continua sem contexto, IA responde de forma genérica
            context = {}
        else:
            logger.debug(f"Contexto construído: {context.get('barbershop', {}).get('name', 'N/A')}")

        # Extrai informações de identidade
        barbershop_config = context.get('barbershop', {})
        ai_name = barbershop_config.get('ai_name', 'Assistente')
        barbershop_name = barbershop_config.get('name', 'Barbearia')

        result['ai_name'] = ai_name
        result['barbershop_name'] = barbershop_name

        # ============= 3. MEMORY RETRIEVAL =============
        logger.debug("Passo 3: Recuperando histórico de chat...")
        chat_history_db = get_chat_history(tenant_id, phone, limit=40)
        result['history_count'] = len(chat_history_db)

        logger.debug(f"Histórico recuperado: {result['history_count']} mensagens")

        # Formata histórico para a IA
        formatted_history = SystemPromptTemplates.format_chat_history(chat_history_db)

        # ============= 4. AI GENERATION =============
        logger.debug("Passo 4: Gerando resposta da IA...")

        # Cria serviço de IA
        ai_service = create_ai_service(provider="openrouter", model="nemotron_nano")

        # Constrói prompt do sistema com identidade
        system_prompt = SystemPromptTemplates.build_system_prompt(
            ai_name=ai_name,
            barbershop_name=barbershop_name,
            context=context
        )

        # Prepara contexto adicional para a IA
        ai_context = {
            'tenant_id': tenant_id,
            'user_id': tenant_id,
            'phone': phone,
            'ai_name': ai_name,
            'barbershop_name': barbershop_name,
            **context
        }

        # Gera resposta
        ai_result = ai_service.generate_response(
            prompt=message,
            context=ai_context,
            chat_history=formatted_history,
            temperature=0.7,
            max_tokens=500
        )

        if not ai_result.get('success'):
            error_msg = ai_result.get('error', 'Erro desconhecido ao gerar resposta')
            logger.error(f"Erro na geração da IA: {error_msg}")
            result['error'] = error_msg
            return result

        response_text = ai_result.get('response', '').strip()
        result['response'] = response_text

        logger.debug(f"Resposta IA gerada: {len(response_text)} caracteres")

        # ============= 5. SAVE USER MESSAGE (opcional) =============
        if save_user_message:
            logger.debug("Passo 5a: Salvando mensagem do usuário...")
            save_result = save_message(
                tenant_id=tenant_id,
                phone=phone,
                role='user',
                message=message,
                metadata={
                    'instance_name': instance_name,
                    'ai_name': ai_name,
                    'type': 'universal_secretary'
                }
            )
            result['message_saved'] = save_result.get('success', False)
            logger.debug(f"Mensagem usuário salva: {result['message_saved']}")

        # ============= 6. SAVE AI RESPONSE =============
        logger.debug("Passo 5b: Salvando resposta da IA...")
        save_result = save_message(
            tenant_id=tenant_id,
            phone=phone,
            role='assistant',
            message=response_text,
            metadata={
                'instance_name': instance_name,
                'ai_name': ai_name,
                'type': 'universal_secretary',
                'model': ai_result.get('model'),
                'provider': ai_result.get('provider'),
                'tokens_used': ai_result.get('tokens_used', 0)
            }
        )

        logger.info(f"Resposta IA salva: {save_result.get('success', False)}")

        # Calcula tempo de processamento
        processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        result['metadata']['processing_time_ms'] = round(processing_time, 2)
        result['success'] = True

        logger.info(
            f"✅ Resposta gerada com sucesso ({result['metadata']['processing_time_ms']}ms)"
        )

        return result

    except TenantResolutionError as e:
        error_msg = f"Erro ao resolver tenant: {e}"
        logger.error(error_msg)
        result['error'] = error_msg
        return result

    except Exception as e:
        error_msg = f"Erro inesperado em generate_response: {e}"
        logger.error(error_msg, exc_info=True)
        result['error'] = error_msg
        result['metadata']['processing_time_ms'] = round(
            (datetime.utcnow() - start_time).total_seconds() * 1000, 2
        )
        return result


def generate_response_simple(
    tenant_id: str,
    phone: str,
    message: str,
    context: Optional[Dict] = None
) -> Dict:
    """
    Versão simplificada sem resolver tenant (usado quando já tem tenant_id).

    Args:
        tenant_id: ID do tenant (user_id)
        phone: Número de telefone do cliente
        message: Mensagem recebida
        context: Contexto opcional (se não fornecido, busca do banco)

    Returns:
        Dict com mesmo formato que generate_response()
    """
    start_time = datetime.utcnow()
    result = {
        'success': False,
        'response': '',
        'tenant_id': tenant_id,
        'user_id': tenant_id,
        'message_saved': False,
        'history_count': 0,
        'ai_name': 'Assistente',
        'barbershop_name': 'Barbearia',
        'error': None,
        'metadata': {
            'phone': phone,
            'processing_time_ms': 0
        }
    }

    try:
        logger.info(f"Gerando resposta simples para {tenant_id}/{phone}")

        # Obter contexto se não fornecido
        if not context:
            context = build_context(tenant_id)

        # Extrai informações de identidade
        barbershop_config = context.get('barbershop', {})
        ai_name = barbershop_config.get('ai_name', 'Assistente')
        barbershop_name = barbershop_config.get('name', 'Barbearia')

        result['ai_name'] = ai_name
        result['barbershop_name'] = barbershop_name

        # Recuperar histórico
        chat_history_db = get_chat_history(tenant_id, phone, limit=40)
        result['history_count'] = len(chat_history_db)
        formatted_history = SystemPromptTemplates.format_chat_history(chat_history_db)

        # Criar serviço de IA
        ai_service = create_ai_service(provider="openrouter", model="nemotron_nano")

        # Construir prompt do sistema
        system_prompt = SystemPromptTemplates.build_system_prompt(
            ai_name=ai_name,
            barbershop_name=barbershop_name,
            context=context
        )

        # Preparar contexto
        ai_context = {
            'tenant_id': tenant_id,
            'user_id': tenant_id,
            'phone': phone,
            'ai_name': ai_name,
            'barbershop_name': barbershop_name,
            **context
        }

        # Gerar resposta
        ai_result = ai_service.generate_response(
            prompt=message,
            context=ai_context,
            chat_history=formatted_history,
            temperature=0.7,
            max_tokens=500
        )

        if not ai_result.get('success'):
            result['error'] = ai_result.get('error', 'Erro na IA')
            return result

        response_text = ai_result.get('response', '').strip()
        result['response'] = response_text

        # Salvar mensagens
        save_message(tenant_id, phone, 'user', message)
        save_message(
            tenant_id, phone, 'assistant', response_text,
            metadata={
                'ai_name': ai_name,
                'type': 'universal_secretary',
                'model': ai_result.get('model'),
                'tokens_used': ai_result.get('tokens_used', 0)
            }
        )

        result['message_saved'] = True
        result['metadata']['processing_time_ms'] = round(
            (datetime.utcnow() - start_time).total_seconds() * 1000, 2
        )
        result['success'] = True

        logger.info(f"✅ Resposta simples gerada com sucesso")
        return result

    except Exception as e:
        logger.error(f"Erro em generate_response_simple: {e}", exc_info=True)
        result['error'] = str(e)
        return result


# ============= FUNÇÕES UTILITÁRIAS =============

def get_conversation_summary(
    instance_name: str,
    phone: str,
    max_messages: int = 10
) -> Optional[Dict]:
    """
    Obtém um resumo da conversa recente.

    Args:
        instance_name: Nome da instância Evolution API
        phone: Número de telefone
        max_messages: Número máximo de mensagens no resumo

    Returns:
        Dict com informações do resumo ou None em caso de erro
    """
    try:
        tenant_id = resolve_tenant(instance_name)
        if not tenant_id:
            return None

        history = get_chat_history(tenant_id, phone, limit=max_messages)

        return {
            'tenant_id': tenant_id,
            'phone': phone,
            'message_count': len(history),
            'messages': history,
            'last_message': history[-1] if history else None
        }

    except Exception as e:
        logger.error(f"Erro ao obter resumo da conversa: {e}")
        return None


def clear_conversation(
    instance_name: str,
    phone: str
) -> Dict:
    """
    Limpa todo o histórico de conversa de um cliente.

    Args:
        instance_name: Nome da instância Evolution API
        phone: Número de telefone

    Returns:
        Dict com status da operação
    """
    try:
        from integrations.postgres_memory import clear_chat_history

        tenant_id = resolve_tenant(instance_name)
        if not tenant_id:
            return {
                'success': False,
                'error': 'Tenant não encontrado'
            }

        result = clear_chat_history(tenant_id, phone)
        result['tenant_id'] = tenant_id

        return result

    except Exception as e:
        logger.error(f"Erro ao limpar conversa: {e}")
        return {
            'success': False,
            'error': str(e)
        }


# ============= TESTES E EXEMPLOS =============

if __name__ == '__main__':
    # Configura logging
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    print("=" * 70)
    print("BarberZap - Secretária Universal IA")
    print("=" * 70)
    print()

    # Exemplo 1: Gerar resposta completa
    print("\n📝 Exemplo 1: generate_response() completo")
    print("-" * 70)

    # NOTA: Substitua com valores reais do seu banco de dados
    test_instance_name = "barbearia_001"
    test_phone = "5511999999999"
    test_message = "Quero agendar um corte para sexta às 14h"

    print(f"Instância: {test_instance_name}")
    print(f"Telefone: {test_phone}")
    print(f"Mensagem: {test_message}")
    print()

    result = generate_response(
        instance_name=test_instance_name,
        phone=test_phone,
        message=test_message
    )

    print()
    print("📊 Resultado:")
    print(f"  Sucesso: {result['success']}")
    print(f"  Tenant ID: {result['tenant_id']}")
    print(f"  Nome IA: {result['ai_name']}")
    print(f"  Barbearia: {result['barbershop_name']}")
    print(f"  Histórico: {result['history_count']} mensagens")
    print(f"  Tempo: {result['metadata']['processing_time_ms']}ms")
    print()

    if result['success']:
        print("🤖 Resposta da IA:")
        print("-" * 70)
        print(result['response'])
        print("-" * 70)
    else:
        print(f"❌ Erro: {result['error']}")

    # Exemplo 2: Obter resumo da conversa
    print("\n\n📝 Exemplo 2: get_conversation_summary()")
    print("-" * 70)

    summary = get_conversation_summary(test_instance_name, test_phone)

    if summary:
        print(f"Tenant ID: {summary['tenant_id']}")
        print(f"Telefone: {summary['phone']}")
        print(f"Mensagens: {summary['message_count']}")
        if summary['last_message']:
            print(f"Última mensagem: {summary['last_message']['message'][:50]}...")
    else:
        print("Erro ao obter resumo")

    print("\n" + "=" * 70)
    print("✨ Exemplos concluídos!")
    print("=" * 70)
