"""
BarberZap CRM Logger

Módulo para gerenciamento de leads e mensagens do CRM.
Integração com Supabase via REST API.

Tabelas (schema existente):
- crm_leads: armazena informações dos leads/contatos
  - id (UUID)
  - tenant_id (UUID)
  - client_phone (VARCHAR) → phone
  - client_name (VARCHAR) → name
  - kanban_stage (VARCHAR) → status (new, contacted, converted, lost)
  - ai_enabled (BOOLEAN)
  - tags (ARRAY/VARCHAR[])
  - notes (TEXT)
  - last_message_at (TIMESTAMPTZ)
  - created_at (TIMESTAMPTZ)

- crm_messages: armazena histórico de conversas
  - id (UUID)
  - tenant_id (UUID)
  - lead_id (UUID references crm_leads)
  - sender_type (VARCHAR) → sender + direction (client = inbound)
  - content (TEXT) → message
  - media_url (VARCHAR, nullable)
  - created_at (TIMESTAMPTZ)

Funções:
- upsert_lead: cria ou atualiza lead
- log_message: registra mensagem no histórico
- get_lead_history: busca histórico completo de conversa
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from integrations.supabase_rest import SupabaseRestClient, get_client


# Configuração de logging
logger = logging.getLogger(__name__)


# ============= TIPOS E EXCEÇÕES =============

class CRMError(Exception):
    """Erro base para operações CRM."""
    pass


class CRMLeadNotFoundError(CRMError):
    """Lead não encontrado."""
    pass


class CRMMessageError(CRMError):
    """Erro ao registrar mensagem."""
    pass


# ============= MAPEAMENTO DE COLUNAS =============

# Mapeamento interno → schema do banco
CRM_LEADS_MAP = {
    'phone': 'client_phone',
    'name': 'client_name',
    'status': 'kanban_stage',
    'email': None,  # Não existe no schema atual
}

CRM_MESSAGES_MAP = {
    'message': 'content',
    'sender': 'sender_type',
    'direction': None,  # Derivado de sender_type
}

# ============= FUNÇÕES AUXILIARES =============

def _normalize_phone(phone: str) -> str:
    """
    Normaliza número de telefone.
    
    Remove caracteres não numéricos.
    
    Args:
        phone: Número de telefone
        
    Returns:
        Telefone normalizado (apenas números)
    """
    return str(phone).replace('+', '').replace('-', '').replace(' ', '').replace('(', '').replace(')', '')


def _map_to_db_schema(data: Dict[str, Any], mapping: Dict[str, Optional[str]]) -> Dict[str, Any]:
    """
    Converte dados do formato interno para o schema do banco.
    
    Args:
        data: Dados no formato interno
        mapping: Dicionário de mapeamento (interno → db)
        
    Returns:
        Dados no formato do banco de dados
    """
    db_data = {}
    
    for key, value in data.items():
        if key in mapping:
            db_key = mapping[key]
            if db_key:  # Se None, a coluna não existe no schema
                db_data[db_key] = value
        else:
            # Mantém campos não mapeados
            db_data[key] = value
    
    return db_data


def _map_from_db_schema(data: Any, tables: List[str] = None) -> Dict[str, Any]:
    """
    Converte dados do schema do banco para formato interno.
    
    Args:
        data: Dados no formato do banco (dict ou lista com 1 elemento)
        tables: Lista de tabelas para aplicar mapeamento reverso
        
    Returns:
        Dados no formato interno
    """
    # Se data for uma lista com um único elemento, extrai o elemento
    if isinstance(data, list) and len(data) > 0:
        data = data[0]
    elif isinstance(data, list):
        # Lista vazia, retorna dict vazio
        return {}
    
    if not isinstance(data, dict):
        return {}
    
    internal_data = {}
    
    # Mapeamento reverso para crm_leads
    if 'crm_leads' in (tables or []):
        reverse_leads = {v: k for k, v in CRM_LEADS_MAP.items() if v}
        for db_key, value in data.items():
            if db_key in reverse_leads:
                internal_data[reverse_leads[db_key]] = value
            else:
                internal_data[db_key] = value
    
    # Mapeamento reverso para crm_messages
    if 'crm_messages' in (tables or []):
        reverse_messages = {v: k for k, v in CRM_MESSAGES_MAP.items() if v}
        derivar_direction = 'sender_type' in data and 'direction' not in data
        
        for db_key, value in data.items():
            if db_key in reverse_messages:
                internal_data[reverse_messages[db_key]] = value
            else:
                internal_data[db_key] = value
        
        # Deriva direction se necessário
        if derivar_direction:
            sender_type = data.get('sender_type', '')
            internal_data['direction'] = 'inbound' if sender_type == 'client' else 'outbound'
    
    # Se não especificou tabela, mantém como está
    if not tables:
        return data
    
    return internal_data


def _infer_direction_from_sender(sender: str, sender_type: Optional[str] = None) -> str:
    """
    Determina direção da mensagem baseada no sender.
    
    Args:
        sender: Nome do remetente
        sender_type: Tipo do remetente (se fornecido)
        
    Returns:
        'inbound' ou 'outbound'
    """
    if sender_type:
        return 'inbound' if sender_type == 'client' else 'outbound'
    
    sender_lower = sender.lower()
    # Remetentes que indicam mensagem enviada pelo sistema
    system_senders = ['sistema', 'bot', 'barbearia', 'ai', 'agent', 'system', 'business']
    return 'outbound' if any(s in sender_lower for s in system_senders) else 'inbound'


def _get_sender_type(sender: str) -> str:
    """
    Determina sender_type baseado no sender.

    OBS: O banco atual só aceita 'client' como sender_type.
    A direção (inbound/outbound) é determinada separadamente.

    Args:
        sender: Nome do remetente

    Returns:
        Sempre 'client' devido a constraint do banco
    """
    # Devido à constraint do banco, sempre retorna 'client'
    # A distinção entre inbound/outbound é feita via campo direction derivado
    return 'client'


# ============= FUNÇÕES PRINCIPAIS =============

def upsert_lead(
    tenant_id: Any,
    phone: str,
    name: Optional[str] = None,
    status: str = "new",
    email: Optional[str] = None,
    notes: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    client: Optional[SupabaseRestClient] = None
) -> Dict[str, Any]:
    """
    Cria ou atualiza lead no CRM.
    
    Args:
        tenant_id: ID do tenant/barbearia (UUID)
        phone: Número de telefone (formato: 5511999999999)
        name: Nome do contato (opcional para update)
        status: Status do lead (default: "new")
                 Mapeado para kanban_stage: new, contacted, converted, lost
        email: Email do contato (opcional, não suportado no schema atual)
        notes: Anotações sobre o lead (opcional)
        metadata: Dados adicionais em formato JSON (opcional)
        client: Instância do SupabaseRestClient (opcional, usa padrão se não fornecido)
        
    Returns:
        Dict com lead criado/atualizado (inclui id) no formato interno
        
    Raises:
        CRMError: Erro ao upsert lead
        
    Exemplos:
        >>> # Criar novo lead
        >>> lead = upsert_lead(tenant_id="uuid-123", phone="5511999999999", name="João Silva")
        >>> print(lead['id'])
        
        >>> # Atualizar lead existente
        >>> updated = upsert_lead(tenant_id="uuid-123", phone="5511999999999", status="contacted")
        >>> print(updated['status'])
    """
    try:
        # Obtém cliente Supabase
        sb_client = client or get_client()
        
        # Normaliza telefone
        phone_normalized = _normalize_phone(phone)
        
        logger.info(f"Upsert lead: tenant_id={tenant_id}, phone={phone_normalized}, status={status}")
        
        # Busca lead existente por tenant_id + client_phone
        existing_lead = sb_client.get(
            'crm_leads',
            {
                'tenant_id': f'eq.{tenant_id}',
                'client_phone': f'eq.{phone_normalized}'
            },
            single=True
        )
        
        if existing_lead:
            # UPDATE: atualiza lead existente
            lead_id = existing_lead['id']
            logger.info(f"Lead encontrado (ID={lead_id}), atualizando...")
            
            # Prepara dados atualizados
            update_data = {
                'kanban_stage': status,
            }
            
            # Atualiza campos opcionais apenas se fornecidos
            if name is not None:
                update_data['client_name'] = name
            if notes is not None:
                update_data['notes'] = notes
            
            # Atualiza timestamp
            update_data['last_message_at'] = datetime.utcnow().isoformat()
            
            # Aplica mapeamento
            db_update_data = _map_to_db_schema(update_data, CRM_LEADS_MAP)
            db_update_data.update({k: v for k, v in update_data.items() if k not in CRM_LEADS_MAP})
            
            # Atualiza no banco (usa PATCH com ID)
            filters = {'id': f'eq.{lead_id}'}
            
            # Monta URL manualmente para PATCH com filtros
            url = sb_client._build_url('crm_leads')
            query_string = sb_client._build_query_string(filters)
            if query_string:
                url = f'{url}?{query_string}'
            
            logger.debug(f"PATCH {url} with data: {update_data}")
            
            response = sb_client.session.request(
                method='PATCH',
                url=url,
                headers=sb_client.headers,
                json=update_data,
                timeout=30
            )
            
            updated_lead = sb_client._handle_response(response)
            
            # Converte para formato interno
            result = _map_from_db_schema(updated_lead, ['crm_leads'])

            # Adiciona metadata se necessário (extraído de tags)
            if metadata and 'metadata' not in result:
                # Se havia metadata no input, adiciona ao resultado
                result['_metadata_source'] = metadata
                result['metadata'] = metadata

            logger.info(f"Lead atualizado: ID={lead_id}, status={status}")
            return result
            
        else:
            # INSERT: cria novo lead
            logger.info("Lead não encontrado, criando novo...")
            
            # Prepara dados para inserção
            insert_data = {
                'tenant_id': tenant_id,
                'client_phone': phone_normalized,
                'kanban_stage': status,
                'ai_enabled': True,  # Atendimento AI habilitado por padrão
                'tags': [],  # Tags vazias por padrão
                'last_message_at': datetime.utcnow().isoformat(),
                'created_at': datetime.utcnow().isoformat()
            }
            
            # Adiciona campos opcionais
            if name:
                insert_data['client_name'] = name
            if notes:
                insert_data['notes'] = notes
            if metadata:
                # Guarda metadata nas tags se for possível
                if isinstance(metadata, dict):
                    tags = []
                    for k, v in metadata.items():
                        tags.append(f"{k}:{v}")
                    insert_data['tags'] = tags[:10]  # Limita a 10 tags
            
            # Insere no banco
            new_lead = sb_client.post('crm_leads', insert_data)

            # Converte para formato interno
            result = _map_from_db_schema(new_lead, ['crm_leads'])

            # Adiciona metadata se foi fornecido
            if metadata:
                result['metadata'] = metadata

            logger.info(f"Lead criado: ID={result.get('id')}, phone={phone_normalized}")
            return result
            
    except Exception as e:
        error_msg = f"Erro ao upsert lead: {e}"
        logger.error(error_msg)
        raise CRMError(error_msg) from e


def log_message(
    tenant_id: Any,
    phone: str,
    sender: str,
    message: str,
    metadata: Optional[Dict[str, Any]] = None,
    direction: Optional[str] = None,
    status: str = "received",
    client: Optional[SupabaseRestClient] = None
) -> Dict[str, Any]:
    """
    Registra mensagem no histórico CRM.
    
    Args:
        tenant_id: ID do tenant/barbearia (UUID)
        phone: Número de telefone do lead
        sender: Nome ou identificador do remetente
        message: Conteúdo da mensagem
        metadata: Metadados adicionais (ex: message_id, media_url, etc.)
        direction: Direção da mensagem ('inbound' ou 'outbound')
                   Se None, deduz automaticamente com base no sender
        status: Status da mensagem (default: "received") - não usado no schema atual
        client: Instância do SupabaseRestClient (opcional)
        
    Returns:
        Dict com mensagem registrada (inclui id) no formato interno
        
    Raises:
        CRMMessageError: Erro ao registrar mensagem
        
    Exemplos:
        >>> # Mensagem recebida
        >>> msg = log_message(tenant_id="uuid-123", phone="5511999999999", 
        ...                  sender="cliente", message="Olá, gostaria de agendar")
        >>> print(msg['id'])
        
        >>> # Mensagem enviada
        >>> msg = log_message(tenant_id="uuid-123", phone="5511999999999",
        ...                  sender="sistema", message="Olá! Bem-vindo à Barbearia!",
        ...                  direction="outbound")
    """
    try:
        # Obtém cliente Supabase
        sb_client = client or get_client()
        
        # Normaliza telefone
        phone_normalized = _normalize_phone(phone)
        
        logger.info(f"Log message: tenant_id={tenant_id}, phone={phone_normalized}, sender={sender}")
        
        # Determina direção automaticamente se não fornecida
        if direction is None:
            direction = _infer_direction_from_sender(sender)
        
        # Determina sender_type
        sender_type = _get_sender_type(sender)
        
        # Busca ou cria lead
        try:
            lead = upsert_lead(
                tenant_id=tenant_id,
                phone=phone_normalized,
                name=sender if direction == 'inbound' else None,
                status='new',  # Usa 'new' por causa da constraint do banco
                client=sb_client
            )
            lead_id = lead['id']
        except Exception as e:
            logger.warning(f"Não foi possível obter/criar lead: {e}")
            lead_id = None
        
        # Prepara dados da mensagem para o banco
        message_data = {
            'tenant_id': tenant_id,
            'lead_id': lead_id,
            'sender_type': sender_type,
            'content': message,
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Adiciona media_url se estiver nos metadados
        if metadata and 'media_url' in metadata:
            message_data['media_url'] = metadata['media_url']
        
        # Registra mensagem no banco
        result = sb_client.post('crm_messages', message_data)

        # Converte para formato interno
        internal_result = _map_from_db_schema(result, ['crm_messages'])
        internal_result['_direction'] = direction
        internal_result['_sender'] = sender

        # Obtém ID (result pode ser uma lista)
        msg_id = result[0]['id'] if isinstance(result, list) else result.get('id')

        logger.info(f"Mensagem registrada: ID={msg_id}, direction={direction}")
        return internal_result
        
    except Exception as e:
        error_msg = f"Erro ao registrar mensagem: {e}"
        logger.error(error_msg)
        raise CRMMessageError(error_msg) from e


def get_lead_history(
    tenant_id: Any,
    phone: str,
    include_lead_info: bool = True,
    limit: Optional[int] = None,
    client: Optional[SupabaseRestClient] = None
) -> List[Dict[str, Any]]:
    """
    Busca histórico completo de conversa do lead.
    
    Args:
        tenant_id: ID do tenant/barbearia (UUID)
        phone: Número de telefone do lead
        include_lead_info: Se True, inclui dados do lead no retorno
        limit: Limite de mensagens (None = todas)
        client: Instância do SupabaseRestClient (opcional)
        
    Returns:
        Lista com histórico de mensagens no formato interno (ordenado por created_at ASC)
        
    Raises:
        CRMError: Erro ao buscar histórico
        
    Exemplos:
        >>> # Buscar histórico completo
        >>> history = get_lead_history(tenant_id="uuid-123", phone="5511999999999")
        >>> for msg in history:
        ...     print(f"{msg['sender']}: {msg['message']}")
        
        >>> # Buscar últimas 10 mensagens
        >>> recent = get_lead_history(tenant_id="uuid-123", phone="5511999999999", limit=10)
    """
    try:
        # Obtém cliente Supabase
        sb_client = client or get_client()
        
        # Normaliza telefone
        phone_normalized = _normalize_phone(phone)
        
        logger.info(f"Get lead history: tenant_id={tenant_id}, phone={phone_normalized}")
        
        # Busca lead para verificar existência
        lead = sb_client.get(
            'crm_leads',
            {
                'tenant_id': f'eq.{tenant_id}',
                'client_phone': f'eq.{phone_normalized}'
            },
            single=True
        )
        
        if not lead:
            logger.warning(f"Lead não encontrado: tenant_id={tenant_id}, phone={phone_normalized}")
            return []
        
        lead_id = lead['id']
        logger.info(f"Lead encontrado: ID={lead_id}")
        
        # Converte lead para formato interno se necessário
        lead_internal = _map_from_db_schema(lead, ['crm_leads'])
        
        # Busca mensagens do lead
        filters = {
            'lead_id': f'eq.{lead_id}',
            'order': 'created_at.asc'
        }
        
        if limit:
            filters['limit'] = str(limit)
        
        messages = sb_client.get('crm_messages', filters)
        
        if not messages:
            logger.info(f"Nenhuma mensagem encontrada para lead ID={lead_id}")
            return []
        
        # Converte mensagens para formato interno e adiciona info do lead
        result = []
        for msg in messages:
            msg_internal = _map_from_db_schema(msg, ['crm_messages'])
            
            # Adiciona info do lead se solicitado
            if include_lead_info:
                msg_internal['_lead_info'] = {
                    'id': lead_internal.get('id'),
                    'name': lead_internal.get('name'),
                    'phone': lead_internal.get('phone'),
                    'status': lead_internal.get('status'),
                    'kanban_stage': lead.get('kanban_stage'),  # Original
                    'created_at': lead_internal.get('created_at')
                }
            
            result.append(msg_internal)
        
        logger.info(f"Histórico recuperado: {len(result)} mensagens")
        return result
        
    except Exception as e:
        error_msg = f"Erro ao buscar histórico do lead: {e}"
        logger.error(error_msg)
        raise CRMError(error_msg) from e


# ============= FUNÇÕES AUXILIARES =============

def lead_exists(
    tenant_id: Any,
    phone: str,
    client: Optional[SupabaseRestClient] = None
) -> bool:
    """
    Verifica se lead existe no CRM.
    
    Args:
        tenant_id: ID do tenant/barbearia (UUID)
        phone: Número de telefone
        client: Instância do SupabaseRestClient (opcional)
        
    Returns:
        True se lead existe, False caso contrário
    """
    try:
        sb_client = client or get_client()
        phone_normalized = _normalize_phone(phone)
        
        lead = sb_client.get(
            'crm_leads',
            {
                'tenant_id': f'eq.{tenant_id}',
                'client_phone': f'eq.{phone_normalized}'
            },
            single=True
        )
        
        return lead is not None
        
    except Exception as e:
        logger.error(f"Erro ao verificar existência do lead: {e}")
        return False


def get_lead_by_id(
    tenant_id: Any,
    lead_id: Any,
    client: Optional[SupabaseRestClient] = None
) -> Optional[Dict[str, Any]]:
    """
    Busca lead por ID.
    
    Args:
        tenant_id: ID do tenant/barbearia (UUID)
        lead_id: ID do lead (UUID)
        client: Instância do SupabaseRestClient (opcional)
        
    Returns:
        Dict com dados do lead no formato interno ou None se não encontrado
    """
    try:
        sb_client = client or get_client()
        
        lead = sb_client.get(
            'crm_leads',
            {
                'id': f'eq.{lead_id}',
                'tenant_id': f'eq.{tenant_id}'
            },
            single=True
        )
        
        if lead:
            return _map_from_db_schema(lead, ['crm_leads'])
        return None
        
    except Exception as e:
        logger.error(f"Erro ao buscar lead por ID: {e}")
        return None


def update_lead_status(
    tenant_id: Any,
    phone: str,
    status: str,
    notes: Optional[str] = None,
    client: Optional[SupabaseRestClient] = None
) -> Dict[str, Any]:
    """
    Atualiza status de um lead.
    
    Args:
        tenant_id: ID do tenant/barbearia (UUID)
        phone: Número de telefone
        status: Novo status ('new', 'contacted', 'converted', 'lost')
        notes: Anotações adicionais (opcional)
        client: Instância do SupabaseRestClient (opcional)
        
    Returns:
        Dict com lead atualizado no formato interno
        
    Raises:
        CRMLeadNotFoundError: Lead não encontrado
    """
    try:
        sb_client = client or get_client()
        phone_normalized = _normalize_phone(phone)
        
        lead = sb_client.get(
            'crm_leads',
            {
                'tenant_id': f'eq.{tenant_id}',
                'client_phone': f'eq.{phone_normalized}'
            },
            single=True
        )
        
        if not lead:
            raise CRMLeadNotFoundError(f"Lead não encontrado: phone={phone_normalized}")
        
        update_data = {
            'kanban_stage': status,
            'last_message_at': datetime.utcnow().isoformat()
        }
        
        if notes:
            existing_notes = lead.get('notes', '') or ''
            update_data['notes'] = f"{existing_notes}\n{notes}" if existing_notes else notes
        
        # Executa PATCH
        url = sb_client._build_url('crm_leads')
        filters = {'id': f'eq.{lead["id"]}'}
        query_string = sb_client._build_query_string(filters)
        if query_string:
            url = f'{url}?{query_string}'
        
        response = sb_client.session.request(
            method='PATCH',
            url=url,
            headers=sb_client.headers,
            json=update_data,
            timeout=30
        )
        
        updated_lead = sb_client._handle_response(response)
        
        return _map_from_db_schema(updated_lead, ['crm_leads'])
        
    except CRMLeadNotFoundError:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar status do lead: {e}")
        raise CRMError(f"Erro ao atualizar status do lead: {e}") from e


def list_leads(
    tenant_id: Any,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    client: Optional[SupabaseRestClient] = None
) -> List[Dict[str, Any]]:
    """
    Lista leads do CRM com filtros opcionais.
    
    Args:
        tenant_id: ID do tenant/barbearia (UUID)
        status: Filtrar por status (opcional) - mapeado para kanban_stage
        limit: Limite de resultados (default: 50)
        offset: Offset para paginação (default: 0)
        client: Instância do SupabaseRestClient (opcional)
        
    Returns:
        Lista de leads no formato interno
    """
    try:
        sb_client = client or get_client()
        
        filters = {
            'tenant_id': f'eq.{tenant_id}',
            'order': 'created_at.desc',
            'limit': str(limit),
            'offset': str(offset)
        }
        
        if status:
            filters['kanban_stage'] = f'eq.{status}'
        
        leads = sb_client.get('crm_leads', filters)
        
        # Converte para formato interno
        return [_map_from_db_schema(lead, ['crm_leads']) for lead in leads] if leads else []
        
    except Exception as e:
        logger.error(f"Erro ao listar leads: {e}")
        return []


def get_message_by_id(
    tenant_id: Any,
    message_id: Any,
    client: Optional[SupabaseRestClient] = None
) -> Optional[Dict[str, Any]]:
    """
    Busca mensagem por ID.
    
    Args:
        tenant_id: ID do tenant/barbearia (UUID)
        message_id: ID da mensagem (UUID)
        client: Instância do SupabaseRestClient (opcional)
        
    Returns:
        Dict com dados da mensagem no formato interno ou None se não encontrada
    """
    try:
        sb_client = client or get_client()
        
        message = sb_client.get(
            'crm_messages',
            {
                'id': f'eq.{message_id}',
                'tenant_id': f'eq.{tenant_id}'
            },
            single=True
        )
        
        if message:
            return _map_from_db_schema(message, ['crm_messages'])
        return None
        
    except Exception as e:
        logger.error(f"Erro ao buscar mensagem por ID: {e}")
        return None


# ============= EXPORTAÇÕES =============

__all__ = [
    # Funções principais
    'upsert_lead',
    'log_message',
    'get_lead_history',
    # Funções auxiliares
    'lead_exists',
    'get_lead_by_id',
    'update_lead_status',
    'list_leads',
    'get_message_by_id',
    # Exceções
    'CRMError',
    'CRMLeadNotFoundError',
    'CRMMessageError',
]


# ============= TESTE DE USO =============

if __name__ == '__main__':
    # Configura logging para testes
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("="*60)
    print("CRM LOGGER - TESTE DE USO (Com schema existente)")
    print("="*60)
    
    try:
        # Dados de teste (use tenant_id real do banco)
        # Para testar, substitua por um tenant_id válido
        test_tenant_id = "d9fd2be4-0768-483b-b122-b60277335e2a"  # Exemplo
        test_phone = "5511999998888"
        test_name = "Teste CRM Python"
        
        print(f"\n⚠️  Usando tenant_id de exemplo: {test_tenant_id}")
        print(f"⚠️  Se este tenant não existir, os testes falharão")
        
        input("\nPressione ENTER para continuar ou Ctrl+C para cancelar...")
        
        # 1. Criar novo lead
        print("\n1. Criando novo lead...")
        lead = upsert_lead(test_tenant_id, test_phone, test_name, status="new")
        print(f"   ✓ Lead criado/atualizado: ID={lead['id']}, Status={lead.get('status')}")
        
        # 2. Atualizar lead existente
        print("\n2. Atualizando lead...")
        updated = upsert_lead(test_tenant_id, test_phone, status="contacted")
        print(f"   ✓ Lead atualizado: Status={updated.get('status')}")
        
        # 3. Registrar mensagem recebida
        print("\n3. Registrando mensagem recebida...")
        msg1 = log_message(
            test_tenant_id,
            test_phone,
            "cliente",
            "Olá! Gostaria de agendar um corte."
        )
        print(f"   ✓ Mensagem registrada: ID={msg1['id']}")
        
        # 4. Registrar mensagem enviada
        print("\n4. Registrando mensagem enviada...")
        msg2 = log_message(
            test_tenant_id,
            test_phone,
            "sistema",
            "Olá! Bem-vindo à Barbearia. Em que podemos ajudar?",
            direction="outbound"
        )
        print(f"   ✓ Mensagem registrada: ID={msg2['id']}")
        
        # 5. Buscar histórico
        print("\n5. Buscando histórico do lead...")
        history = get_lead_history(test_tenant_id, test_phone)
        print(f"   ✓ Histórico: {len(history)} mensagens")
        for msg in history:
            print(f"      - [{msg.get('_direction', msg.get('direction', '?')).upper()}] {msg.get('_sender', '?')}: {msg.get('message', msg.get('content', ''))[:50]}...")
        
        print("\n" + "="*60)
        print("✓ TESTE CONCLUÍDO COM SUCESSO")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n✗ Erro no teste: {e}")
        import traceback
        traceback.print_exc()
