"""
BarberZap Supabase REST API Wrapper

Wrapper robusto para integração com Supabase via REST API.

Tabelas:
- whatsapp_instances: instâncias WhatsApp (instance_name → user_id)
- agente_config: configurações da barbearia
- barbers: barbeiros ativos
- services: serviços e preços
- crm_leads: leads do CRM
- crm_messages: mensagens do CRM
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional, Union
from urllib.parse import urljoin, urlencode
import requests
from requests.exceptions import RequestException


# Configuração de logging
logger = logging.getLogger(__name__)


class SupabaseError(Exception):
    """Erro base para operações Supabase."""
    pass


class SupabaseConnectionError(SupabaseError):
    """Erro de conexão com Supabase."""
    pass


class SupabaseResponseError(SupabaseError):
    """Erro na resposta de Supabase."""
    pass


class SupabaseValidationError(SupabaseError):
    """Erro de validação de dados."""
    pass


class SupabaseRestClient:
    """
    Cliente REST Supabase para BarberZap.
    
    Fornece interface simples e robusta para operações CRUD
    usando a REST API do Supabase.
    """
    
    # Headers padrão
    DEFAULT_HEADERS = {
        'apikey': None,
        'Authorization': None,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    def __init__(
        self,
        url: Optional[str] = None,
        service_role_key: Optional[str] = None
    ):
        """
        Inicializa o cliente Supabase.
        
        Args:
            url: URL base do Supabase (ex: https://project.supabase.co)
            service_role_key: SERVICE_ROLE_KEY para autenticação
        """
        self.url = url or os.getenv(
            'SUPABASE_URL',
            'https://htssqiupscyhhueqwpgu.supabase.co'
        )
        self.service_role_key = service_role_key or os.getenv(
            'SUPABASE_SERVICE_ROLE_KEY',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0c3NxaXVwc2N5aGh1ZXF3cGd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYyNjY1OCwiZXhwIjoyMDc3MjAyNjU4fQ.tp-3z2K2QvBWSCB--uOyv-eGOImLKpTvcXgM04w2N38'
        )
        
        self._setup_headers()
        self.session = requests.Session()
        
        logger.info(f"SupabaseRestClient inicializado: URL={self.url}")
    
    def _setup_headers(self):
        """Configura headers de autenticação."""
        self.headers = self.DEFAULT_HEADERS.copy()
        self.headers['apikey'] = self.service_role_key
        self.headers['Authorization'] = f'Bearer {self.service_role_key}'
    
    def _build_url(self, table: str) -> str:
        """
        Constrói URL completa para a tabela.
        
        Args:
            table: Nome da tabela
            
        Returns:
            URL completa
        """
        # Remove '/' inicial/final do nome da tabela
        table = table.strip('/')
        return urljoin(f'{self.url}/rest/v1/', table)
    
    def _build_query_string(self, filters: Optional[Dict[str, Any]]) -> str:
        """
        Constrói query string para filtros.
        
        Suporta:
        - equality: column=value
        - operators: column=eq.value, column=gt.5, etc.
        - ordering: order=column.desc
        - limit: limit=10
        - offset: offset=0
        - select: select=col1,col2,col3
        
        Args:
            filters: Dicionário de filtros
            
        Returns:
            Query string formatada
        """
        if not filters:
            return ''
        
        params = {}
        
        # Processa filtros especiais
        for key, value in filters.items():
            if key == 'select':
                params['select'] = value
            elif key == 'order':
                if isinstance(value, str):
                    params['order'] = value
                elif isinstance(value, dict):
                    col = value.get('column')
                    direction = value.get('direction', 'asc')
                    params['order'] = f'{col}.{direction}'
            elif key == 'limit':
                params['limit'] = str(value)
            elif key == 'offset':
                params['offset'] = str(value)
            elif key == 'range':
                # Formato: [min, max]
                if isinstance(value, (list, tuple)) and len(value) == 2:
                    self.range_header = f'{value[0]}-{value[1]}'
            else:
                # Filtros de coluna suportam operadores
                # col=value, col=eq.value, col=gt.value, etc.
                params[key] = value
        
        return urlencode(params, doseq=True) if params else ''
    
    def _handle_response(self, response: requests.Response) -> Any:
        """
        Processa resposta HTTP e retorna dados ou levanta erro.
        
        Args:
            response: Objeto Response do requests
            
        Returns:
            Dados da resposta (JSON ou texto)
            
        Raises:
            SupabaseConnectionError: Erro de conexão
            SupabaseResponseError: Erro na resposta
        """
        try:
            # Verifica status code
            if response.status_code >= 200 and response.status_code < 300:
                # Sucesso
                if response.status_code == 204:
                    # No Content (DELETE, etc.)
                    return None
                
                # Tenta parsear JSON
                content = response.content
                if not content:
                    return None
                
                return response.json()
            
            # Erros HTTP
            error_info = {
                'status_code': response.status_code,
                'url': response.url,
                'method': response.request.method if response.request else 'UNKNOWN'
            }
            
            try:
                error_data = response.json()
                error_info['details'] = error_data
                error_message = error_data.get('message', str(error_data))
            except:
                error_message = response.text or 'Unknown error'
                error_info['text'] = error_message
            
            logger.error(f"Supabase API error: {error_info}")
            raise SupabaseResponseError(error_message, error_info)
            
        except json.JSONDecodeError:
            logger.error(f"JSON decode error for response: {response.text[:500]}")
            raise SupabaseResponseError('Invalid JSON response')
    
    def _request(
        self,
        method: str,
        table: str,
        data: Optional[Dict[str, Any]] = None,
        filters: Optional[Dict[str, Any]] = None,
        headers_overrides: Optional[Dict[str, str]] = None
    ) -> Any:
        """
        Executa requisição HTTP para Supabase.
        
        Args:
            method: Método HTTP (GET, POST, PATCH, DELETE)
            table: Nome da tabela
            data: Dados para POST/PATCH
            filters: Filtros/parâmetros de query
            headers_overrides: Overrides para headers específicos
            
        Returns:
            Dados da resposta
        """
        url = self._build_url(table)
        query_string = self._build_query_string(filters)
        
        if query_string:
            url = f'{url}?{query_string}'
        
        headers = self.headers.copy()
        if headers_overrides:
            headers.update(headers_overrides)
        
        # Range header
        if hasattr(self, 'range_header'):
            headers['Range'] = self.range_header
            delattr(self, 'range_header')
        
        logger.debug(f"Supabase {method} request to: {url}")
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                headers=headers,
                json=data if method in ['POST', 'PATCH'] else None,
                timeout=30
            )
            return self._handle_response(response)
            
        except RequestException as e:
            logger.error(f"Request failed: {e}")
            raise SupabaseConnectionError(f"Connection error: {e}")
    
    # ============= MÉTODOS CRUD PÚBLICOS =============
    
    def get(
        self,
        table: str,
        filters: Optional[Dict[str, Any]] = None,
        single: bool = False
    ) -> Union[List[Dict[str, Any]], Dict[str, Any], None]:
        """
        Busca registros na tabela.
        
        Args:
            table: Nome da tabela
            filters: Filtros para query
                    - col=value (igualdade)
                    - col=eq.value (igualdade explícita)
                    - col=gt.value (maior que)
                    - col=gte.value (maior ou igual)
                    - col=lt.value (menor que)
                    - col=lte.value (menor ou igual)
                    - col=like.value (LIKE)
                    - col=ilike.value (case-insensitive LIKE)
                    - col=is.value (IS NULL/TRUE/FALSE)
                    - col=in.(val1,val2) (IN)
                    - select=col1,col2 (colunas específicas)
                    - order=column.desc (ordenação)
                    - limit=10 (limite)
                    - offset=0 (pular registros)
            single: Se True, retorna apenas o primeiro registro
            
        Returns:
            Lista de registros ou único registro se single=True
            
        Example:
            # Buscar todos
            results = client.get('barbers')
            
            # Buscar com filtro simples
            results = client.get('barbers', {'active': 'true'})
            
            # Buscar com múltiplos filtros
            results = client.get('crm_leads', {
                'status': 'eq.new',
                'order': 'created_at.desc',
                'limit': '10'
            })
            
            # Buscar colunas específicas
            results = client.get('services', {
                'select': 'id,name,price'
            })
            
            # Buscar único registro
            barber = client.get('barbers', {'id': 'eq.123'}, single=True)
        """
        result = self._request('GET', table, filters=filters)
        
        if single:
            if isinstance(result, list):
                return result[0] if result else None
            return result
        
        return result if result else []
    
    def post(
        self,
        table: str,
        data: Union[Dict[str, Any], List[Dict[str, Any]]]
    ) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Insere novo registro(s) na tabela.
        
        Args:
            table: Nome da tabela
            data: Dados para inserção (dict ou lista de dicts)
            
        Returns:
            Registro(s) inserido(s) com IDs gerados
            
        Example:
            # Inserir único registro
            result = client.post('crm_leads', {
                'name': 'João Silva',
                'phone': '5511999999999',
                'status': 'new'
            })
            
            # Inserir múltiplos registros
            results = client.post('crm_messages', [
                {'lead_id': 1, 'message': 'Olá!'},
                {'lead_id': 2, 'message': 'Bem-vindo!'}
            ])
        """
        if not data:
            raise SupabaseValidationError('Data cannot be empty')
        
        return self._request('POST', table, data=data)
    
    def patch(
        self,
        table: str,
        id: Union[str, int],
        data: Dict[str, Any],
        id_column: str = 'id'
    ) -> Optional[Dict[str, Any]]:
        """
        Atualiza registro existente.
        
        Args:
            table: Nome da tabela
            id: Valor do ID do registro
            data: Dados para atualização
            id_column: Nome da coluna ID (padrão: 'id')
            
        Returns:
            Registro atualizado ou None se não encontrado
            
        Example:
            # Atualizar por ID
            result = client.patch('barbers', 1, {
                'active': False,
                'name': 'Novo Nome'
            })
            
            # Atualizar com outra coluna como ID
            result = client.patch('whatsapp_instances', 'inst_001', {
                'status': 'connected'
            }, id_column='instance_name')
        """
        if not data:
            raise SupabaseValidationError('Data cannot be empty')
        
        filters = {id_column: f'eq.{id}'}
        return self._request('PATCH', table, data=data, filters=filters)
    
    def delete(
        self,
        table: str,
        id: Union[str, int],
        id_column: str = 'id'
    ) -> bool:
        """
        Remove registro da tabela.
        
        Args:
            table: Nome da tabela
            id: Valor do ID do registro
            id_column: Nome da coluna ID (padrão: 'id')
            
        Returns:
            True se sucesso
            
        Example:
            # Deletar por ID
            success = client.delete('crm_leads', 1)
            
            # Deletar com outra coluna como ID
            success = client.delete('whatsapp_instances', 'inst_001',
                                   id_column='instance_name')
        """
        filters = {id_column: f'eq.{id}'}
        self._request('DELETE', table, filters=filters)
        return True
    
    def upsert(
        self,
        table: str,
        filters: Dict[str, Any],
        data: Dict[str, Any],
        id_column: str = 'id'
    ) -> Optional[Dict[str, Any]]:
        """
        Insert ou updade (upsert).
        
        Primeiro tenta buscar registro com os filtros.
        Se encontrar, atualiza (PATCH). Se não, insere (POST).
        
        Args:
            table: Nome da tabela
            filters: Filtros para buscar registro existente
            data: Dados para inserir/atualizar
            id_column: Coluna usada para identificar registros únicos
            
        Returns:
            Registro inserido ou atualizado
            
        Example:
            # Upsert por instance_name
            result = client.upsert('whatsapp_instances',
                                   {'instance_name': 'inst_001'},
                                   {'status': 'connected',
                                    'user_id': 123})
            
            # Upsert por user_id
            result = client.upsert('agente_config',
                                   {'user_id': 'eq.123'},
                                   {'barber_name': 'Barbearia Exemplo',
                                    'address': 'Rua 123'})
        """
        # Tenta buscar registro existente
        existing = self.get(table, filters, single=True)
        
        if existing:
            # Atualiza
            existing_id = existing.get(id_column)
            logger.info(f"Upsert: atualizando registro {existing_id} em {table}")
            
            # Remove id_column do data para evitar conflito
            update_data = data.copy()
            update_data.pop(id_column, None)
            
            return self.patch(table, existing_id, update_data, id_column)
        else:
            # Insere novo
            logger.info(f"Upsert: inserindo novo registro em {table}")
            return self.post(table, data)
    
    # ============= MÉTODOS UTILITÁRIOS =============
    
    def count(
        self,
        table: str,
        filters: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Conta registros na tabela.
        
        Args:
            table: Nome da tabela
            filters: Filtros para contagem
            
        Returns:
            Número de registros
        """
        # Usa header Prefer para contar
        headers_overrides = {
            'Prefer': 'count=exact'
        }
        
        # range header para obter count
        self.range_header = '0-0'
        
        try:
            response = self.session.request(
                method='HEAD',
                url=self._build_url(table),
                headers={**self.headers, **headers_overrides},
                params=self._build_query_params(filters),
                timeout=30
            )
            
            count_header = response.headers.get('Content-Range', '')
            if count_header:
                # Formato: 0-0/total
                parts = count_header.split('/')
                return int(parts[-1]) if len(parts) > 1 else 0
            
            return 0
            
        except RequestException as e:
            logger.error(f"Count failed: {e}")
            return 0
    
    def _build_query_params(
        self,
        filters: Optional[Dict[str, Any]]
    ) -> Dict[str, str]:
        """Constrói parâmetros de query."""
        if not filters:
            return {}
        
        return {k: str(v) for k, v in filters.items()}
    
    def exists(
        self,
        table: str,
        filters: Dict[str, Any]
    ) -> bool:
        """
        Verifica se registro existe.
        
        Args:
            table: Nome da tabela
            filters: Filtros para busca
            
        Returns:
            True se registro existe
        """
        result = self.get(table, filters, single=True)
        return result is not None
    
    def batch操作(
        self,
        operations: List[Dict[str, Any]]
    ) -> List[Any]:
        """
        Executa múltiplas operações em lote (sequencial).
        
        Args:
            operations: Lista de operações
                [
                    {'method': 'post', 'table': 'crm_leads', 'data': {...}},
                    {'method': 'patch', 'table': 'barbers', 'id': 1, 'data': {...}},
                    {'method': 'get', 'table': 'services', 'filters': {...}}
                ]
            
        Returns:
            Lista de resultados de cada operação
        """
        results = []
        
        for op in operations:
            method = op.get('method', '').lower()
            table = op.get('table')
            
            if not table:
                raise SupabaseValidationError('Operation missing table')
            
            try:
                if method == 'get':
                    result = self.get(
                        table,
                        op.get('filters'),
                        op.get('single', False)
                    )
                elif method == 'post':
                    result = self.post(table, op.get('data'))
                elif method == 'patch':
                    result = self.patch(
                        table,
                        op.get('id'),
                        op.get('data'),
                        op.get('id_column', 'id')
                    )
                elif method == 'delete':
                    result = self.delete(
                        table,
                        op.get('id'),
                        op.get('id_column', 'id')
                    )
                elif method == 'upsert':
                    result = self.upsert(
                        table,
                        op.get('filters'),
                        op.get('data'),
                        op.get('id_column', 'id')
                    )
                else:
                    raise SupabaseValidationError(f'Unknown method: {method}')
                
                results.append(result)
                
            except Exception as e:
                logger.error(f"Batch operation failed: {e}")
                results.append({'error': str(e)})
        
        return results
    
    def table_info(self, table: str) -> Dict[str, Any]:
        """
        Obtém metadados de uma tabela (via introspection).
        
        Args:
            table: Nome da tabela
            
        Returns:
            Metadados da tabela
        """
        try:
            # Tenta buscar primeiro registro para inferir estrutura
            sample = self.get(table, {'limit': '1'})
            
            if sample:
                return {
                    'table': table,
                    'columns': list(sample[0].keys()) if isinstance(sample, list) else list(sample.keys()),
                    'sample': sample[0] if isinstance(sample, list) else sample
                }
            
            return {'table': table, 'columns': [], 'sample': None}
            
        except Exception as e:
            logger.error(f"Failed to get table info: {e}")
            return {'table': table, 'error': str(e)}
    
    def close(self):
        """Fecha a sessão HTTP."""
        self.session.close()
        logger.info("SupabaseRestClient closed")
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()


# ============= FUNÇÕES CONVENIENCE =============

# Instância global padrão
_default_client: Optional[SupabaseRestClient] = None


def get_client(
    url: Optional[str] = None,
    service_role_key: Optional[str] = None
) -> SupabaseRestClient:
    """
    Obtém ou cria instância do cliente Supabase.
    
    Args:
        url: URL base do Supabase
        service_role_key: SERVICE_ROLE_KEY
        
    Returns:
        Instância do cliente
    """
    global _default_client
    
    if _default_client is None:
        _default_client = SupabaseRestClient(url, service_role_key)
    
    return _default_client


# Funções de atalho
def supabase_get(
    table: str,
    filters: Optional[Dict[str, Any]] = None,
    single: bool = False
) -> Union[List[Dict[str, Any]], Dict[str, Any], None]:
    """Atalho para get()."""
    return get_client().get(table, filters, single)


def supabase_post(
    table: str,
    data: Union[Dict[str, Any], List[Dict[str, Any]]]
) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
    """Atalho para post()."""
    return get_client().post(table, data)


def supabase_patch(
    table: str,
    id: Union[str, int],
    data: Dict[str, Any],
    id_column: str = 'id'
) -> Optional[Dict[str, Any]]:
    """Atalho para patch()."""
    return get_client().patch(table, id, data, id_column)


def supabase_delete(
    table: str,
    id: Union[str, int],
    id_column: str = 'id'
) -> bool:
    """Atalho para delete()."""
    return get_client().delete(table, id, id_column)


def supabase_upsert(
    table: str,
    filters: Dict[str, Any],
    data: Dict[str, Any],
    id_column: str = 'id'
) -> Optional[Dict[str, Any]]:
    """Atalho para upsert()."""
    return get_client().upsert(table, filters, data, id_column)


# ============= EXEMPLOS DE USO =============

if __name__ == '__main__':
    # Configura logging
    logging.basicConfig(level=logging.DEBUG)
    
    # Exemplo de uso
    with SupabaseRestClient() as client:
        # Listar barbeiros ativos
        barbers = client.get('barbers', {'active': 'true'})
        print(f"Barbeiros ativos: {len(barbers) if barbers else 0}")
        
        # Buscar configuração
        config = client.get('agente_config', {'user_id': 'eq.1'}, single=True)
        print(f"Configuração: {config}")
        
        # Inserir lead
        new_lead = client.post('crm_leads', {
            'name': 'Test User',
            'phone': '5511999999999',
            'status': 'new'
        })
        print(f"Lead criado: {new_lead}")
