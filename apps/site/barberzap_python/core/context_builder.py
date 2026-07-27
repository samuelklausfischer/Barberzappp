"""
BarberZap Context Builder

Módulo responsável por construir o contexto completo de uma barbearia
para uso pelos agentes de IA.

Consulta:
- agente_config: Configurações da barbearia
- barbers: Lista de barbeiros ativos
- services: Lista de serviços disponíveis

Retorna dict estruturado pronto para uso pelos agentes.
"""

import json
import logging
from typing import Dict, List, Any, Optional

# Configuração de logging
logger = logging.getLogger(__name__)


# Importação do cliente Supabase
from integrations.supabase_rest import SupabaseRestClient, get_client
# Preferencias aceitas pela interface. Mantemos a lista fechada para que um
# valor vindo do banco nunca consiga alterar as instrucoes de seguranca do
# agente por meio do campo de tom.
_TONE_ALIASES = {
    'formal': 'formal',
    'profissional': 'formal',
    'professional': 'formal',
    'amigavel': 'amigavel',
    'amigável': 'amigavel',
    'friendly': 'amigavel',
    'descolado': 'descolado',
    'casual': 'descolado',
}
_DEFAULT_TONE = 'amigavel'
_DEFAULT_BOOKING_INTERVAL_MINUTES = 30


def _metadata(config: Dict[str, Any]) -> Dict[str, Any]:
    """Le metadata tanto como objeto JSON quanto como string JSON."""
    value = config.get('metadata')
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except (TypeError, ValueError):
            return {}
    return {}


def _normalize_tone(value: Any) -> str:
    """Converte aliases legados no conjunto fechado de tons da IA."""
    key = str(value or '').strip().lower()
    return _TONE_ALIASES.get(key, _DEFAULT_TONE)


def _normalize_business_rules(value: Any) -> str:
    """Limita preferencias editaveis e remove marcadores de prompt."""
    if not isinstance(value, str):
        return ''
    # Regras sao uma preferencia operacional, nunca um novo system prompt.
    return value.replace(chr(0), '').replace('```', '').strip()[:1200]


def _normalize_booking_interval(value: Any) -> int:
    """Retorna intervalo seguro em minutos, limitado a 5-240."""
    try:
        interval = int(value)
    except (TypeError, ValueError):
        return _DEFAULT_BOOKING_INTERVAL_MINUTES
    return max(5, min(240, interval))


def _extract_ai_preferences(config: Dict[str, Any]) -> Dict[str, Any]:
    """Extrai preferencias novas sem quebrar registros de versoes antigas."""
    metadata = _metadata(config)
    tone = (
        config.get('prompt_tone')
        or config.get('tone')
        or metadata.get('prompt_tone')
        or metadata.get('tone')
    )
    rules = (
        config.get('prompt_business_rules')
        or config.get('business_rules')
        or metadata.get('prompt_business_rules')
        or metadata.get('business_rules')
    )
    interval = (
        config.get('booking_interval_minutes')
        or metadata.get('booking_interval_minutes')
    )
    return {
        'tone': _normalize_tone(tone),
        'business_rules': _normalize_business_rules(rules),
        'booking_interval_minutes': _normalize_booking_interval(interval),
    }


def build_context(
    user_id: str,
    client: Optional[SupabaseRestClient] = None
) -> Optional[Dict[str, Any]]:
    """
    Build complete context for a barbershop.

    Consulta as tabelas agente_config, barbers e services para construir
    o contexto completo da barbearia.

    Args:
        user_id: Tenant ID (user_id da barbearia)
        client: Instância opcional do SupabaseRestClient.
                Se não fornecido, usa o cliente padrão.

    Returns:
        Dict com estrutura:
            {
                'barbershop': {
                    'user_id': str,
                    'name': str,
                    'address': str,
                    'hours': str,
                    'ai_name': str,
                    'phone': str,
                    'whatsapp': str
                },
                'barbers': [
                    {
                        'id': int,
                        'name': str,
                        'status': str
                    },
                    ...
                ],
                'services': [
                    {
                        'id': int,
                        'name': str,
                        'price': float,
                        'description': str,
                        'duration': int,
                        'status': str
                    },
                    ...
                ]
            }

        Returns None se:
        - user_id não for válido
        - Configuração não for encontrada
        - Erro nas queries

    Example:
        >>> context = build_context('123')
        >>> print(context['barbershop']['name'])
        'Barbearia do João'
        >>> print([b['name'] for b in context['barbers']])
        ['João Silva', 'Pedro Santos']
    """
    # Validação básica
    if not user_id or not isinstance(user_id, str):
        logger.error(f"Invalid user_id: {user_id}")
        return None

    # Obtém cliente Supabase
    supabase = client or get_client()

    try:
        # ============= 1. BUSCA CONFIGURAÇÃO DA BARBEARIA =============
        logger.debug(f"Fetching agente_config for user_id: {user_id}")

        agente_config = supabase.get(
            'agente_config',
            {'user_id': f'eq.{user_id}'},
            single=True
        )

        if not agente_config:
            logger.warning(f"agente_config not found for user_id: {user_id}")
            return None

        # Extrai dados da barbearia com valores padrão
        # Mapeia campos do banco para o padrão interno
        ai_preferences = _extract_ai_preferences(agente_config)
        barbershop = {
            'user_id': user_id,
            'name': (
                agente_config.get('barber_name') or 
                agente_config.get('name') or
                agente_config.get('nome_barbearia') or
                f'Barbearia {user_id[:8]}'
            ),
            'address': (
                agente_config.get('endereco') or 
                agente_config.get('address') or 
                ''
            ),
            'hours': (
                agente_config.get('horarios') or
                agente_config.get('horario_funcionamento') or 
                agente_config.get('hours') or 
                ''
            ),
            'ai_name': (
                agente_config.get('nome_ia') or
                agente_config.get('ai_name') or 
                'Assistente'
            ),
            'greeting': agente_config.get('saudacao') or '',
            'phone': agente_config.get('phone') or '',
            'whatsapp': agente_config.get('whatsapp') or '',
            'tone': ai_preferences['tone'],
            'business_rules': ai_preferences['business_rules'],
            'booking_interval_minutes': ai_preferences['booking_interval_minutes']
        }

        logger.debug(f"Barbershop config: {barbershop['name']}")

        # ============= 2. BUSCA BARBEIROS ATIVOS =============
        logger.debug("Fetching active barbers")

        barbers = supabase.get(
            'barbers',
            {
                'user_id': f'eq.{user_id}',
                'status': 'eq.active'
            }
        )

        # Normaliza lista de barbeiros
        barbers_list = []
        if barbers:
            for barber in barbers:
                barbers_list.append({
                    'id': barber.get('id'),
                    'name': barber.get('name') or '',
                    'status': barber.get('status') or 'active'
                })

        logger.debug(f"Found {len(barbers_list)} active barbers")

        # ============= 3. BUSCA SERVIÇOS ATIVOS =============
        logger.debug("Fetching active services")

        services = supabase.get(
            'services',
            {
                'user_id': f'eq.{user_id}',
                'status': 'eq.active'
            }
        )

        # Normaliza lista de serviços
        services_list = []
        if services:
            for service in services:
                services_list.append({
                    'id': service.get('id'),
                    'name': service.get('name') or '',
                    'price': float(service.get('price') or 0),
                    'description': service.get('description') or '',
                    'duration': int(service.get('duration') or 30),
                    'status': service.get('status') or 'active'
                })

        logger.debug(f"Found {len(services_list)} active services")

        # ============= 4. MONTA E RETORNA CONTEXTO COMPLETO =============
        context = {
            'barbershop': barbershop,
            'barbers': barbers_list,
            'services': services_list,
            # Atalhos para consumidores que nao precisam conhecer o schema interno.
            'tone': ai_preferences['tone'],
            'business_rules': ai_preferences['business_rules'],
            'booking_interval_minutes': ai_preferences['booking_interval_minutes'],
            'preferences': ai_preferences
        }

        logger.info(f"Context built successfully for {barbershop['name']}")
        logger.debug(f"Context summary: {len(barbers_list)} barbers, {len(services_list)} services")

        return context

    except Exception as e:
        logger.error(f"Error building context for user_id {user_id}: {e}", exc_info=True)
        return None


def build_context_string(
    user_id: str,
    client: Optional[SupabaseRestClient] = None
) -> Optional[str]:
    """
    Build context and return as formatted string for AI prompts.

    Cria uma representação em texto do contexto para uso em prompts
    de agentes de IA.

    Args:
        user_id: Tenant ID
        client: Instância opcional do SupabaseRestClient

    Returns:
        String formatada ou None em caso de erro

    Example:
        >>> ctx_str = build_context_string('123')
        >>> print(ctx_str)
        Barbearia: Barbearia do João
        Endereço: Rua das Flores, 123
        Horário: Seg-Sex 9h-19h, Sáb 9h-14h

        Barbeiros:
        - João Silva
        - Pedro Santos

        Serviços:
        - Corte (R$ 35)
        - Barba (R$ 25)
        - Corte + Barba (R$ 50)
    """
    context = build_context(user_id, client)

    if not context:
        return None

    # Constrói string formatada
    lines = []

    # Barbershop info
    bs = context['barbershop']
    lines.append(f"Barbearia: {bs['name']}")
    if bs['address']:
        lines.append(f"Endereço: {bs['address']}")
    if bs['hours']:
        lines.append(f"Horário: {bs['hours']}")
    if bs['phone']:
        lines.append(f"Telefone: {bs['phone']}")
    if bs['whatsapp']:
        lines.append(f"WhatsApp: {bs['whatsapp']}")
    lines.append("")

    # Barbers
    if context['barbers']:
        lines.append("Barbeiros:")
        for barber in context['barbers']:
            lines.append(f"- {barber['name']}")
        lines.append("")

    # Services
    if context['services']:
        lines.append("Serviços:")
        for service in context['services']:
            price_str = f"R$ {service['price']:.2f}"
            lines.append(f"- {service['name']} ({price_str})")
            if service['description']:
                lines.append(f"  {service['description']}")
            if service['duration']:
                duration_str = f"{service['duration']} min"
                lines.append(f"  Duração: {duration_str}")

    return '\n'.join(lines)


def get_barbers_list(
    user_id: str,
    active_only: bool = True,
    client: Optional[SupabaseRestClient] = None
) -> List[Dict[str, Any]]:
    """
    Retorna apenas a lista de barbeiros.

    Função auxiliar para quando só se precisa da lista de barbeiros.

    Args:
        user_id: Tenant ID
        active_only: Se True, retorna apenas barbeiros ativos
        client: Instância opcional do SupabaseRestClient

    Returns:
        Lista de barbeiros ou lista vazia
    """
    supabase = client or get_client()

    try:
        filters = {'user_id': f'eq.{user_id}'}
        if active_only:
            filters['status'] = 'eq.active'

        barbers = supabase.get('barbers', filters)

        return [
            {
                'id': b.get('id'),
                'name': b.get('name') or '',
                'status': b.get('status') or 'unknown'
            }
            for b in barbers
        ] if barbers else []

    except Exception as e:
        logger.error(f"Error fetching barbers for user_id {user_id}: {e}")
        return []


def get_services_list(
    user_id: str,
    active_only: bool = True,
    client: Optional[SupabaseRestClient] = None
) -> List[Dict[str, Any]]:
    """
    Retorna apenas a lista de serviços.

    Função auxiliar para quando só se precisa da lista de serviços.

    Args:
        user_id: Tenant ID
        active_only: Se True, retorna apenas serviços ativos
        client: Instância opcional do SupabaseRestClient

    Returns:
        Lista de serviços ou lista vazia
    """
    supabase = client or get_client()

    try:
        filters = {'user_id': f'eq.{user_id}'}
        if active_only:
            filters['status'] = 'eq.active'

        services = supabase.get('services', filters)

        return [
            {
                'id': s.get('id'),
                'name': s.get('name') or '',
                'price': float(s.get('price') or 0),
                'description': s.get('description') or '',
                'duration': int(s.get('duration') or 30),
                'status': s.get('status') or 'unknown'
            }
            for s in services
        ] if services else []

    except Exception as e:
        logger.error(f"Error fetching services for user_id {user_id}: {e}")
        return []


def get_barbershop_config(
    user_id: str,
    client: Optional[SupabaseRestClient] = None
) -> Optional[Dict[str, Any]]:
    """
    Retorna apenas a configuração da barbearia.

    Função auxiliar para quando só se precisa da configuração básica.

    Args:
        user_id: Tenant ID
        client: Instância opcional do SupabaseRestClient

    Returns:
        Dict com configuração ou None em caso de erro
    """
    supabase = client or get_client()

    try:
        config = supabase.get(
            'agente_config',
            {'user_id': f'eq.{user_id}'},
            single=True
        )

        if not config:
            return None

        ai_preferences = _extract_ai_preferences(config)

        return {
            'user_id': user_id,
            'name': (
                config.get('barber_name') or
                config.get('name') or
                config.get('nome_barbearia') or
                f'Barbearia {user_id[:8]}'
            ),
            'address': (
                config.get('endereco') or
                config.get('address') or
                ''
            ),
            'hours': (
                config.get('horarios') or
                config.get('horario_funcionamento') or
                config.get('hours') or
                ''
            ),
            'ai_name': (
                config.get('nome_ia') or
                config.get('ai_name') or
                'Assistente'
            ),
            'greeting': config.get('saudacao') or '',
            'phone': config.get('phone') or '',
            'whatsapp': config.get('whatsapp') or '',
            'tone': ai_preferences['tone'],
            'business_rules': ai_preferences['business_rules'],
            'booking_interval_minutes': ai_preferences['booking_interval_minutes']
        }

    except Exception as e:
        logger.error(f"Error fetching barbershop config for user_id {user_id}: {e}")
        return None


# ============= FUNÇÕES DE VALIDAÇÃO =============

def validate_context(context: Dict[str, Any], strict: bool = False) -> bool:
    """
    Valida se o contexto está completo e válido.

    Args:
        context: Dict retornado por build_context()
        strict: Se True, exige nome não-vazio e outros campos obrigatórios.
                Se False, valida apenas presença dos campos.

    Returns:
        True se válido, False caso contrário
    """
    if not context:
        return False

    # Verifica se tem seções principais
    required_sections = ['barbershop', 'barbers', 'services']
    for section in required_sections:
        if section not in context:
            logger.error(f"Context missing required section: {section}")
            return False

    # Verifica barbershop
    bs = context['barbershop']

    # Em modo strict, verifica se o dict existe e tem nome
    if strict:
        if not bs:
            logger.error("Invalid barbershop config")
            return False
        if not bs.get('name'):
            logger.error("Barbershop name is required in strict mode")
            return False
    else:
        # Em modo não-strict, apenas verifica que não é None
        if bs is None:
            logger.error("Invalid barbershop config")
            return False

    # Verifica se tem pelo menos 1 barbeiro (opcional, pode ser configurável)
    # if not context['barbers']:
    #     logger.warning("No barbers found in context")

    # Verifica se tem pelo menos 1 serviço (opcional, pode ser configurável)
    # if not context['services']:
    #     logger.warning("No services found in context")

    return True


# ============= EXEMPLO DE USO =============

if __name__ == '__main__':
    # Configura logging
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Exemplo 1: Construir contexto completo
    print("=" * 60)
    print("Exemplo 1: build_context()")
    print("=" * 60)

    # Substituir por um user_id válido do seu banco
    test_user_id = '1'

    context = build_context(test_user_id)

    if context:
        print(f"\n✓ Contexto construído com sucesso!")
        print(f"\nBarbearia: {context['barbershop']['name']}")
        print(f"Endereço: {context['barbershop']['address']}")
        print(f"Horário: {context['barbershop']['hours']}")
        print(f"\nBarbeiros ({len(context['barbers'])}):")
        for b in context['barbers']:
            print(f"  - {b['name']} (ID: {b['id']}, Status: {b['status']})")
        print(f"\nServiços ({len(context['services'])}):")
        for s in context['services']:
            print(f"  - {s['name']} (R$ {s['price']:.2f}, ID: {s['id']})")
    else:
        print("\n✗ Falha ao construir contexto")

    # Exemplo 2: Contexto como string
    print("\n" + "=" * 60)
    print("Exemplo 2: build_context_string()")
    print("=" * 60)

    ctx_str = build_context_string(test_user_id)
    if ctx_str:
        print(f"\n{ctx_str}")
    else:
        print("\n✗ Falha ao construir contexto string")

    # Exemplo 3: Apenas barbeiros
    print("\n" + "=" * 60)
    print("Exemplo 3: get_barbers_list()")
    print("=" * 60)

    barbers = get_barbers_list(test_user_id)
    print(f"\n{len(barbers)} barbeiros encontrados:")
    for b in barbers:
        print(f"  - {b['name']}")

    # Exemplo 4: Apenas serviços
    print("\n" + "=" * 60)
    print("Exemplo 4: get_services_list()")
    print("=" * 60)

    services = get_services_list(test_user_id)
    print(f"\n{len(services)} serviços encontrados:")
    for s in services:
        print(f"  - {s['name']} - R$ {s['price']:.2f}")

    # Exemplo 5: Apenas configuração
    print("\n" + "=" * 60)
    print("Exemplo 5: get_barbershop_config()")
    print("=" * 60)

    bs_config = get_barbershop_config(test_user_id)
    if bs_config:
        print(f"\nNome: {bs_config['name']}")
        print(f"AI Name: {bs_config['ai_name']}")
        print(f"WhatsApp: {bs_config['whatsapp']}")
    else:
        print("\nConfiguração não encontrada")

    # Exemplo 6: Validação
    print("\n" + "=" * 60)
    print("Exemplo 6: validate_context()")
    print("=" * 60)

    if context:
        is_valid = validate_context(context)
        print(f"\nContexto válido: {is_valid}")
