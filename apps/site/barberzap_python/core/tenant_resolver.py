"""
BarberZap - Tenant Resolver for SaaS Multi-Tenant

Módulo responsável por resolver o tenant ID (user_id) a partir
de um nome de instância Evolution API.

Table Structure (whatsapp_instances):
- id: int (PK)
- instance_name: str (unique) - Nome da instância Evolution API
- user_id: str (FK para agente_config) - ID do usuário/tenant
- status: str (active, inactive, suspended)
- api_key: str (opcional)
- webhook_url: str (opcional)
- created_at: timestamp
- updated_at: timestamp
"""

import logging
from typing import Optional
from functools import lru_cache

from integrations.supabase_rest import SupabaseRestClient, get_client, SupabaseError


# Configuração de logging
logger = logging.getLogger(__name__)


class TenantResolutionError(Exception):
    """Exceção para erros na resolução de tenant."""
    pass


class TenantNotFoundError(TenantResolutionError):
    """Instância não encontrada no banco de dados."""
    pass


class TenantInactiveError(TenantResolutionError):
    """Tenant associado à instância está inativo."""
    pass


def resolve_tenant(
    instance_name: str,
    check_active: bool = True,
    use_cache: bool = True
) -> Optional[str]:
    """
    Resolve tenant ID (user_id) a partir do nome da instância Evolution API.
    
    Args:
        instance_name: Nome da instância Evolution API (ex: "barbearia_001")
        check_active: Se True, verifica se o tenant está ativo
        use_cache: Se True, usa cache LRU para consultas repetidas
        
    Returns:
        user_id do tenant se encontrado, None caso contrário
        
    Raises:
        TenantNotFoundError: Quando a instância não é encontrada
        TenantInactiveError: Quando check_active=True e tenant está inativo
        TenantResolutionError: Erros genéricos de resolução
        
    Example:
        >>> resolve_tenant("barbearia_001")
        '12345'
        
        >>> resolve_tenant("instancia_inexistente")
        None
        
        >>> resolve_tenant("barbearia_001", check_active=False)
        '12345'  # Mesmo se estiver inativo
    """
    if not instance_name:
        logger.warning("resolve_tenant chamado com instance_name vazio")
        return None
    
    # Normaliza o nome da instância
    instance_name = instance_name.strip()
    
    logger.debug(f"Resolvendo tenant para instance_name: '{instance_name}'")
    
    try:
        # Obtém cliente Supabase
        client = get_client()
        
        # Monta filtro para buscar pelo instance_name
        filters = {
            'instance_name': f'eq.{instance_name}'
        }
        
        # Adiciona filtro de status se necessário
        if check_active:
            filters['status'] = 'eq.active'
        
        # Busca registro único
        result = client.get(
            table='whatsapp_instances',
            filters=filters,
            single=True
        )
        
        if not result:
            logger.warning(
                f"Instância não encontrada: '{instance_name}' "
                f"(check_active={check_active})"
            )
            if check_active:
                # Verifica se a instância existe mas está inativa
                inactive_result = client.get(
                    table='whatsapp_instances',
                    filters={'instance_name': f'eq.{instance_name}'},
                    single=True
                )
                if inactive_result:
                    logger.info(
                        f"Instância encontrada mas está inativa: '{instance_name}' "
                        f"(status={inactive_result.get('status')})"
                    )
                    raise TenantInactiveError(
                        f"Tenant '{instance_name}' está inativo. "
                        f"Status atual: {inactive_result.get('status')}"
                    )
            
            return None
        
        # Extrai user_id
        user_id = result.get('user_id')
        
        if not user_id:
            logger.error(
                f"Instância não possui user_id: '{instance_name}' "
                f"(registro: {result})"
            )
            return None
        
        logger.info(
            f"Tenant resolvido com sucesso: '{instance_name}' -> user_id={user_id}"
        )
        
        return user_id
        
    except TenantInactiveError:
        # Relevanta erro de tenant inativo
        raise
        
    except SupabaseError as e:
        logger.error(f"Erro Supabase ao resolver tenant: {e}")
        raise TenantResolutionError(f"Erro de banco de dados: {e}")
        
    except Exception as e:
        logger.error(f"Erro inesperado ao resolver tenant: {e}")
        raise TenantResolutionError(f"Erro ao resolver tenant: {e}")


def resolve_tenant_safe(instance_name: str) -> Optional[str]:
    """
    Versão segura de resolve_tenant que não levanta exceções.
    
    Em caso de erro, retorna None e loga o erro.
    
    Args:
        instance_name: Nome da instância Evolution API
        
    Returns:
        user_id do tenant se encontrado, None caso contrário
        
    Example:
        >>> resolve_tenant_safe("barbearia_001")
        '12345'
        
        >>> resolve_tenant_safe("instancia_inexistente")
        None
        
        >>> resolve_tenant_safe("instancia_inativa")
        None  # Loga o erro mas não levanta exceção
    """
    try:
        return resolve_tenant(instance_name)
    except (TenantNotFoundError, TenantInactiveError) as e:
        logger.warning(f"Tenant não disponível: {e}")
        return None
    except TenantResolutionError as e:
        logger.error(f"Erro ao resolver tenant: {e}")
        return None


def get_tenant_instance_info(
    instance_name: str,
    user_id: Optional[str] = None
) -> Optional[dict]:
    """
    Obtém informações completas da instância.
    
    Args:
        instance_name: Nome da instância Evolution API
        user_id: ID do usuário (opcional, para filtrar por tenant)
        
    Returns:
        Dicionário com informações da instância ou None
        
    Example:
        >>> get_tenant_instance_info("barbearia_001")
        {
            'id': 1,
            'instance_name': 'barbearia_001',
            'user_id': '12345',
            'status': 'active',
            'api_key': 'xxx',
            'webhook_url': 'https://...',
            'created_at': '2026-02-23T12:00:00Z',
            'updated_at': '2026-02-23T12:00:00Z'
        }
    """
    if not instance_name:
        return None
    
    try:
        client = get_client()
        
        filters = {'instance_name': f'eq.{instance_name}'}
        
        if user_id:
            filters['user_id'] = f'eq.{user_id}'
        
        result = client.get(
            table='whatsapp_instances',
            filters=filters,
            single=True
        )
        
        return result
        
    except SupabaseError as e:
        logger.error(f"Erro ao obter info da instância: {e}")
        return None


def is_instance_active(instance_name: str) -> bool:
    """
    Verifica se uma instância está ativa.
    
    Args:
        instance_name: Nome da instância Evolution API
        
    Returns:
        True se ativa, False caso contrário
        
    Example:
        >>> is_instance_active("barbearia_001")
        True
        
        >>> is_instance_active("instancia_inativa")
        False
    """
    try:
        result = get_tenant_instance_info(instance_name)
        
        if not result:
            return False
        
        return result.get('status') == 'active'
        
    except Exception as e:
        logger.error(f"Erro ao verificar status da instância: {e}")
        return False


def list_tenant_instances(user_id: str, active_only: bool = True) -> list:
    """
    Lista todas as instâncias de um tenant.
    
    Args:
        user_id: ID do usuário/tenant
        active_only: Se True, retorna apenas instâncias ativas
        
    Returns:
        Lista de dicionários com informações das instâncias
        
    Example:
        >>> list_tenant_instances("12345")
        [
            {
                'instance_name': 'barbearia_001',
                'status': 'active',
                'created_at': '2026-02-23T12:00:00Z'
            },
            {
                'instance_name': 'barbearia_002',
                'status': 'active',
                'created_at': '2026-02-23T14:00:00Z'
            }
        ]
    """
    if not user_id:
        return []
    
    try:
        client = get_client()
        
        filters = {'user_id': f'eq.{user_id}'}
        
        if active_only:
            filters['status'] = 'eq.active'
        
        # Seleciona apenas colunas relevantes
        filters['select'] = 'instance_name,status,created_at,updated_at'
        
        results = client.get(
            table='whatsapp_instances',
            filters=filters
        )
        
        return results if results else []
        
    except SupabaseError as e:
        logger.error(f"Erro ao listar instâncias do tenant: {e}")
        return []


def validate_tenant_access(
    instance_name: str,
    expected_user_id: str
) -> bool:
    """
    Valida se uma instância pertence ao tenant especificado.
    
    Útil para verificação de segurança em operações cross-tenant.
    
    Args:
        instance_name: Nome da instância Evolution API
        expected_user_id: ID do usuário esperado
        
    Returns:
        True se a instância pertence ao tenant, False caso contrário
        
    Example:
        >>> validate_tenant_access("barbearia_001", "12345")
        True
        
        >>> validate_tenant_access("barbearia_outra", "12345")
        False
    """
    if not instance_name or not expected_user_id:
        return False
    
    try:
        resolved_user_id = resolve_tenant(
            instance_name,
            check_active=False  # Não bloqueia instâncias inativas aqui
        )
        
        if not resolved_user_id:
            return False
        
        return str(resolved_user_id) == str(expected_user_id)
        
    except Exception as e:
        logger.error(f"Erro ao validar acesso do tenant: {e}")
        return False


# ============= FUNÇÕES DE CACHE =============

# Cache LRU para resoluções frequentes (últimas 128 entradas)
@lru_cache(maxsize=128)
def resolve_tenant_cached(instance_name: str) -> Optional[str]:
    """
    Versão com cache LRU de resolve_tenant.
    
    Útil para Webhooks que recebem múltiplas mensagens da mesma instância.
    
    Args:
        instance_name: Nome da instância Evolution API
        
    Returns:
        user_id do tenant se encontrado, None caso contrário
        
    Note:
        O cache pode ser limpo com: resolve_tenant_cached.cache_clear()
    """
    return resolve_tenant_safe(instance_name)


# ============= TESTES E EXEMPLOS =============

if __name__ == '__main__':
    # Configura logging para testes
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Exemplo 1: Resolver tenant
    print("\n=== Exemplo 1: Resolver Tenant ===")
    try:
        user_id = resolve_tenant("barbearia_001")
        print(f"User ID: {user_id}")
    except TenantResolutionError as e:
        print(f"Erro: {e}")
    
    # Exemplo 2: Resolver tenant com verificação de inatividade
    print("\n=== Exemplo 2: Resolver com check_active=True ===")
    try:
        user_id = resolve_tenant("barbearia_inativa", check_active=True)
        print(f"User ID: {user_id}")
    except TenantInactiveError as e:
        print(f"Tenant inativo: {e}")
    
    # Exemplo 3: Versão safe (sem exceções)
    print("\n=== Exemplo 3: Versão Safe ===")
    user_id = resolve_tenant_safe("barbearia_001")
    print(f"User ID (safe): {user_id}")
    
    # Exemplo 4: Obter informações completas
    print("\n=== Exemplo 4: Informações Completas ===")
    info = get_tenant_instance_info("barbearia_001")
    print(f"Info: {info}")
    
    # Exemplo 5: Verificar se ativa
    print("\n=== Exemplo 5: Verificar Status ===")
    is_active = is_instance_active("barbearia_001")
    print(f"Está ativa? {is_active}")
    
    # Exemplo 6: Listar instâncias de um tenant
    print("\n=== Exemplo 6: Listar Instâncias ===")
    instances = list_tenant_instances("12345")
    print(f"Instâncias: {instances}")
    
    # Exemplo 7: Validar acesso
    print("\n=== Exemplo 7: Validar Acesso ===")
    has_access = validate_tenant_access("barbearia_001", "12345")
    print(f"Tem acesso? {has_access}")
    
    # Exemplo 8: Usar cache
    print("\n=== Exemplo 8: Cache LRU ===")
    for i in range(3):
        user_id = resolve_tenant_cached("barbearia_001")
        print(f"Consulta {i+1}: {user_id} (do cache na 2ª e 3ª)")
    
    # Demonstrar stats do cache
    print(f"\nCache info: {resolve_tenant_cached.cache_info()}")
