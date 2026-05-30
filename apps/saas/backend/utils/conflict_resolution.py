"""
BarberZap - Conflict Resolution Module

Este módulo implementa o sistema de resolução de conflitos
para o backend Python, focado em detectar e tratar
conflitos de concorrência.

Funcionalidades:
- detect_conflict(): Detecta se uma exceção representa um conflito
- handle_conflict_with_retry(): Retry com exponential backoff
- log_conflict(): Log de conflitos em banco de dados
- get_conflict_stats(): Estatísticas de conflitos
- ConflictResolutionError: Classe de erro para conflitos
"""

import json
import time
import logging
import asyncio
from typing import Optional, Dict, Any, Callable, List, TypeVar, Tuple
from datetime import datetime, timedelta
from functools import wraps
from dataclasses import dataclass, field
from enum import Enum

# Importar Supabase client (assumindo que existe)
try:
    from supabase import create_client, Client
except ImportError:
    # Fallback para estrutura típica
    Client = None
    create_client = None

logger = logging.getLogger(__name__)

# ============================================================================
# ENUMS E CONSTANTES
# ============================================================================

class ConflictType(Enum):
    """Tipos de conflito"""
    VERSION_MISMATCH = "version_mismatch"
    DOUBLE_BOOKING = "double_booking"
    SLOT_CONFLICT = "slot_conflict"
    CONCURRENT_UPDATE = "concurrent_update"
    CONCURRENT_CANCELLATION = "concurrent_cancellation"
    STALE_DATA = "stale_data"
    UNKNOWN = "unknown"


class AtomicResultCode(Enum):
    """Códigos de resultado de operações atômicas"""
    SUCCESS = "success"
    VERSION_MISMATCH = "version_mismatch"
    SLOT_NOT_AVAILABLE = "slot_not_available"
    PAYMENT_PENDING = "payment_pending"
    SERVICE_UNAVAILABLE = "service_unavailable"
    EMPLOYEE_UNAVAILABLE = "employee_unavailable"
    NOT_FOUND = "not_found"
    PERMISSION_DENIED = "permission_denied"
    INVALID_DATA = "invalid_data"
    UNKNOWN_ERROR = "unknown_error"


# ============================================================================
# EXCEPTIONS
# ============================================================================

class ConflictResolutionError(Exception):
    """
    Erro de resolução de conflitos
    
    Attributes:
        conflict_type: Tipo do conflito
        expected_version: Versão esperada
        current_version: Versão atual
        old_data: Dados antigos
        timestamp: Timestamp do erro
        retry_count: Quantas tentativas já foram feitas
    """
    
    def __init__(
        self,
        message: str,
        conflict_type: ConflictType = ConflictType.UNKNOWN,
        expected_version: Optional[int] = None,
        current_version: Optional[int] = None,
        old_data: Optional[Dict[str, Any]] = None,
        retry_count: int = 0
    ):
        super().__init__(message)
        self.conflict_type = conflict_type
        self.expected_version = expected_version
        self.current_version = current_version
        self.old_data = old_data or {}
        self.timestamp = datetime.utcnow()
        self.retry_count = retry_count
    
    def is_version_mismatch(self) -> bool:
        return self.conflict_type == ConflictType.VERSION_MISMATCH
    
    def is_slot_conflict(self) -> bool:
        return self.conflict_type in [
            ConflictType.SLOT_CONFLICT,
            ConflictType.DOUBLE_BOOKING
        ]
    
    def is_not_found(self) -> bool:
        return self.conflict_type == ConflictType.STALE_DATA
    
    def get_drift(self) -> Optional[int]:
        """Retorna a diferença entre versão atual e esperada"""
        if self.expected_version is not None and self.current_version is not None:
            return self.current_version - self.expected_version
        return None
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário JSON-serializável"""
        return {
            "error_type": "ConflictResolutionError",
            "message": str(self),
            "conflict_type": self.conflict_type.value,
            "expected_version": self.expected_version,
            "current_version": self.current_version,
            "version_drift": self.get_drift(),
            "old_data": self.old_data,
            "timestamp": self.timestamp.isoformat(),
            "retry_count": self.retry_count
        }


# ============================================================================
# CONFIGURAÇÃO DE RETRY
# ============================================================================

@dataclass
class RetryConfig:
    """Configuração para retry com exponential backoff"""
    max_retries: int = 3
    base_delay_ms: int = 500
    max_delay_ms: int = 10000
    jitter_ms: int = 200
    retry_on_conflict_codes: List[ConflictType] = field(default_factory=lambda: [
        ConflictType.VERSION_MISMATCH,
        ConflictType.SLOT_CONFLICT,
        ConflictType.CONCURRENT_UPDATE,
        ConflictType.CONCURRENT_CANCELLATION
    ])
    on_retry_callback: Optional[Callable[[int, ConflictResolutionError], None]] = None
    
    def get_delay(self, attempt: int) -> float:
        """
        Calcula delay com exponential backoff + jitter
        
        Args:
            attempt: Número da tentativa (1-indexed)
            
        Returns:
            Delay em segundos
        """
        exponential_delay = self.base_delay_ms * (2 ** (attempt - 1))
        delay = min(exponential_delay, self.max_delay_ms)
        jitter = (hash(time.time() * 1000) % self.jitter_ms) - (self.jitter_ms // 2)
        return (delay + jitter) / 1000


# ============================================================================
@dataclass
class ConflictStats:
    """Estatísticas de conflitos"""
    shop_id: str
    table_name: str
    total_conflicts: int
    version_mismatches: int
    double_bookings: int
    slot_conflicts: int
    concurrent_updates: int
    concurrent_cancellations: int
    first_conflict: Optional[datetime]
    last_conflict: Optional[datetime]
    by_type: Dict[str, int] = field(default_factory=dict)
    
    @classmethod
    def from_db_row(cls, row: Dict[str, Any]) -> 'ConflictStats':
        return cls(
            shop_id=row.get('shop_id'),
            table_name=row.get('table_name'),
            total_conflicts=row.get('conflicts', 0),
            version_mismatches=row.get('version_mismatches', 0),
            double_bookings=row.get('double_bookings', 0),
            slot_conflicts=row.get('slot_conflicts', 0),
            concurrent_updates=row.get('concurrent_updates', 0),
            concurrent_cancellations=row.get('concurrent_cancellations', 0),
            first_conflict=row.get('first_conflict'),
            last_conflict=row.get('last_conflict'),
            by_type=row.get('by_type', {})
        )
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "shop_id": self.shop_id,
            "table_name": self.table_name,
            "total_conflicts": self.total_conflicts,
            "by_type": {
                "version_mismatch": self.version_mismatches,
                "double_booking": self.double_bookings,
                "slot_conflict": self.slot_conflicts,
                "concurrent_update": self.concurrent_updates,
                "concurrent_cancellation": self.concurrent_cancellations
            },
            "first_conflict": self.first_conflict.isoformat() if self.first_conflict else None,
            "last_conflict": self.last_conflict.isoformat() if self.last_conflict else None,
            "hours_span": (
                (self.last_conflict - self.first_conflict).total_seconds() / 3600
                if self.first_conflict and self.last_conflict
                else None
            )
        }


# ============================================================================
# FUNÇÕES DE DETECÇÃO DE CONFLITO
# ============================================================================

def detect_conflict(exception: Exception) -> bool:
    """
    Detecta se uma exceção representa um conflito de concorrência
    
    Args:
        exception: Exceção a verificar
        
    Returns:
        True se for conflito, False caso contrário
    """
    # Verificar se é ConflictResolutionError
    if isinstance(exception, ConflictResolutionError):
        return True
    
    # Verificar mensagem de erro para padrões comuns
    error_msg = str(exception).lower()
    conflict_patterns = [
        'version mismatch',
        'version conflict',
        'concurrent update',
        'race condition',
        'double booking',
        'slot already booked',
        'duplicate key',
        'optimistic lock'
    ]
    
    return any(pattern in error_msg for pattern in conflict_patterns)


def detect_conflict_type(exception: Exception) -> ConflictType:
    """
    Detecta o tipo específico de conflito
    
    Args:
        exception: Exceção a analisar
        
    Returns:
        Tipo do conflito
    """
    if isinstance(exception, ConflictResolutionError):
        return exception.conflict_type
    
    error_msg = str(exception).lower()
    
    if 'version' in error_msg:
        return ConflictType.VERSION_MISMATCH
    
    if 'slot' in error_msg or 'double' in error_msg:
        return ConflictType.DOUBLE_BOOKING
    
    if 'update' in error_msg and 'concurrent' in error_msg:
        return ConflictType.CONCURRENT_UPDATE
    
    if 'cancel' in error_msg and 'concurrent' in error_msg:
        return ConflictType.CONCURRENT_CANCELLATION
    
    return ConflictType.UNKNOWN


def parse_atomic_result(result: Dict[str, Any]) -> Optional[ConflictResolutionError]:
    """
    Parse resultado de função atômica SQL e retorna erro se houver conflito
    
    Args:
        result: Resultado da chamada RPC do Supabase
        
    Returns:
        ConflictResolutionError se houver conflito, None caso contrário
    """
    if not isinstance(result, dict):
        return None
    
    if result.get('success'):
        return None
    
    code = result.get('code')
    
    if code == 'version_mismatch':
        return ConflictResolutionError(
            message=result.get('message', 'Version mismatch'),
            conflict_type=ConflictType.VERSION_MISMATCH,
            expected_version=result.get('data', {}).get('expected_version'),
            current_version=result.get('data', {}).get('current_version'),
            old_data=result.get('old_data')
        )
    
    if code in ['slot_not_available', 'double_booking']:
        return ConflictResolutionError(
            message=result.get('message', 'Slot conflict'),
            conflict_type=ConflictType.SLOT_CONFLICT,
            old_data=result.get('data')
        )
    
    if code == 'not_found':
        return ConflictResolutionError(
            message=result.get('message', 'Not found'),
            conflict_type=ConflictType.STALE_DATA
        )
    
    if code in ['permission_denied', 'service_unavailable', 'employee_unavailable']:
        return ConflictResolutionError(
            message=result.get('message', 'Operation denied'),
            conflict_type=ConflictType.UNKNOWN
        )
    
    return None


# ============================================================================
# LOG DE CONFLITOS
# ============================================================================

async def log_conflict_async(
    supabase: Client,
    shop_id: str,
    table_name: str,
    record_id: Optional[str],
    conflict_type: ConflictType,
    details: Dict[str, Any],
    changed_by: str = "system"
) -> Optional[str]:
    """
    Log assíncrono de conflito em audit_logs via Supabase RPC
    
    Args:
        supabase: Cliente Supabase
        shop_id: ID da loja
        table_name: Nome da tabela
        record_id: ID do registro (opcional)
        conflict_type: Tipo do conflito
        details: Detalhes do conflito
        changed_by: Quem causou o conflito
        
    Returns:
        ID do log criado, ou None se falhar
    """
    try:
        result = supabase.rpc('log_conflict', {
            'p_shop_id': shop_id,
            'p_conflict_type': conflict_type.value,
            'p_table_name': table_name,
            'p_record_id': record_id,
            'p_details': details,
            'p_changed_by': changed_by
        })
        
        return result.data
    except Exception as e:
        logger.error(f"Error logging conflict: {e}")
        return None


def log_conflict(
    supabase: Client,
    shop_id: str,
    table_name: str,
    record_id: Optional[str],
    conflict_type: ConflictType,
    details: Dict[str, Any],
    changed_by: str = "system"
) -> Optional[str]:
    """
    Log síncrono de conflito em audit_logs via Supabase RPC
    
    Args:
        supabase: Cliente Supabase
        shop_id: ID da loja
        table_name: Nome da tabela
        record_id: ID do registro (opcional)
        conflict_type: Tipo do conflito
        details: Detalhes do conflito
        changed_by: Quem causou o conflito
        
    Returns:
        ID do log criado, ou None se falhar
    """
    try:
        result = supabase.rpc('log_conflict', {
            'p_shop_id': shop_id,
            'p_conflict_type': conflict_type.value,
            'p_table_name': table_name,
            'p_record_id': record_id,
            'p_details': details,
            'p_changed_by': changed_by
        })
        
        return result.data
    except Exception as e:
        logger.error(f"Error logging conflict: {e}")
        return None


# ============================================================================
# ESTATÍSTICAS DE CONFLITOS
# ============================================================================

def get_conflict_stats(
    supabase: Client,
    shop_id: Optional[str] = None
) -> List[ConflictStats]:
    """
    Obtém estatísticas de conflitos via Supabase RPC
    
    Args:
        supabase: Cliente Supabase
        shop_id: ID da loja (opcional, retorna todas se None)
        
    Returns:
        Lista de ConflictStats
    """
    try:
        result = supabase.rpc('get_conflict_stats', {
            'p_shop_id': shop_id
        })
        
        if not result.data:
            return []
        
        return [
            ConflictStats.from_db_row(row)
            for row in result.data
        ]
    except Exception as e:
        logger.error(f"Error getting conflict stats: {e}")
        return []


def get_recent_conflicts(
    supabase: Client,
    shop_id: Optional[str] = None,
    hours: int = 24
) -> List[Dict[str, Any]]:
    """
    Obtém conflitos recentes via view v_recent_conflicts
    
    Args:
        supabase: Cliente Supabase
        shop_id: ID da loja (opcional)
        hours: Horas de histórico (padrão: 24)
        
    Returns:
        Lista de conflitos
    """
    try:
        query = supabase.table('v_recent_conflicts').select('*')
        
        if shop_id:
            query = query.eq('shop_id', shop_id)
        
        query = query.gte('changed_at', datetime.utcnow() - timedelta(hours=hours))
        query = query.order('changed_at', desc=True).limit(100)
        
        result = query.execute()
        
        return result.data or []
    except Exception as e:
        logger.error(f"Error getting recent conflicts: {e}")
        return []


# ============================================================================
# RETRY COM EXPONENTIAL BACKOFF
# ============================================================================

T = TypeVar('T')


def handle_conflict_with_retry(
    supabase: Client,
    operation: Callable[[], T],
    config: Optional[RetryConfig] = None,
    shop_id: Optional[str] = None,
    table_name: Optional[str] = None,
    record_id: Optional[str] = None
) -> T:
    """
    Executa operação com retry automático em caso de conflitos
    
    Args:
        supabase: Cliente Supabase para logging
        operation: Função a executar
        config: Configuração de retry
        shop_id: ID da loja para logging
        table_name: Nome da tabela para logging
        record_id: ID do registro para logging
        
    Returns:
        Resultado da operação
        
    Raises:
        ConflictResolutionError: Se todas as tentativas falharem
    """
    if config is None:
        config = RetryConfig()
    
    last_error = None
    
    for attempt in range(1, config.max_retries + 1):
        try:
            result = operation()
            return result
            
        except ConflictResolutionError as e:
            last_error = e
            e.retry_count = attempt
            
            # Log do conflito
            if shop_id and table_name:
                log_conflict(
                    supabase=supabase,
                    shop_id=shop_id,
                    table_name=table_name,
                    record_id=record_id,
                    conflict_type=e.conflict_type,
                    details={
                        'attempt': attempt,
                        'expected_version': e.expected_version,
                        'current_version': e.current_version,
                        'error_message': str(e)
                    }
                )
            
            # Verificar se deve fazer retry
            should_retry = (
                e.conflict_type in config.retry_on_conflict_codes
                and attempt < config.max_retries
            )
            
            if not should_retry:
                logger.warning(
                    f"Conflict type {e.conflict_type} not retryable or max retries reached"
                )
                raise
            
            # Chamar callback
            if config.on_retry_callback:
                config.on_retry_callback(attempt, e)
            
            # Calcular delay e esperar
            delay = config.get_delay(attempt)
            logger.warning(
                f"Conflict detected (attempt {attempt}/{config.max_retries}). "
                f"Retrying in {delay:.2f}s... - {e}"
            )
            
            time.sleep(delay)
            
        except Exception as e:
            last_error = e
            
            # Verificar se é conflito
            if detect_conflict(e):
                conflict = ConflictResolutionError(
                    message=str(e),
                    conflict_type=detect_conflict_type(e),
                    retry_count=attempt
                )
                
                # Log do conflito
                if shop_id and table_name:
                    log_conflict(
                        supabase=supabase,
                        shop_id=shop_id,
                        table_name=table_name,
                        record_id=record_id,
                        conflict_type=conflict.conflict_type,
                        details={
                            'attempt': attempt,
                            'original_error': str(e)
                        }
                    )
                
                # Verificar se deve fazer retry
                should_retry = (
                    conflict.conflict_type in config.retry_on_conflict_codes
                    and attempt < config.max_retries
                )
                
                if not should_retry:
                    raise conflict
                
                # Chamar callback
                if config.on_retry_callback:
                    config.on_retry_callback(attempt, conflict)
                
                # Calcular delay e esperar
                delay = config.get_delay(attempt)
                logger.warning(
                    f"Conflict detected (attempt {attempt}/{config.max_retries}). "
                    f"Retrying in {delay:.2f}s... - {e}"
                )
                
                time.sleep(delay)
            else:
                raise
    
    # Se chegou aqui, todas as tentativas falharam
    raise last_error or ConflictResolutionError(
        "Max retries exceeded",
        conflict_type=ConflictType.UNKNOWN
    )


async def handle_conflict_with_retry_async(
    supabase: Client,
    operation: Callable[[], T],
    config: Optional[RetryConfig] = None,
    shop_id: Optional[str] = None,
    table_name: Optional[str] = None,
    record_id: Optional[str] = None
) -> T:
    """
    Versão assíncrona de handle_conflict_with_retry
    """
    if config is None:
        config = RetryConfig()
    
    last_error = None
    
    for attempt in range(1, config.max_retries + 1):
        try:
            result = await operation()
            return result
            
        except ConflictResolutionError as e:
            last_error = e
            e.retry_count = attempt
            
            # Log do conflito
            if shop_id and table_name:
                await log_conflict_async(
                    supabase=supabase,
                    shop_id=shop_id,
                    table_name=table_name,
                    record_id=record_id,
                    conflict_type=e.conflict_type,
                    details={
                        'attempt': attempt,
                        'expected_version': e.expected_version,
                        'current_version': e.current_version,
                        'error_message': str(e)
                    }
                )
            
            # Verificar se deve fazer retry
            should_retry = (
                e.conflict_type in config.retry_on_conflict_codes
                and attempt < config.max_retries
            )
            
            if not should_retry:
                raise
            
            # Chamar callback
            if config.on_retry_callback:
                config.on_retry_callback(attempt, e)
            
            # Calcular delay e esperar
            delay = config.get_delay(attempt)
            logger.warning(
                f"Conflict detected (attempt {attempt}/{config.max_retries}). "
                f"Retrying in {delay:.2f}s... - {e}"
            )
            
            await asyncio.sleep(delay)
            
        except Exception as e:
            last_error = e
            
            # Verificar se é conflito
            if detect_conflict(e):
                conflict = ConflictResolutionError(
                    message=str(e),
                    conflict_type=detect_conflict_type(e),
                    retry_count=attempt
                )
                
                # Log do conflito
                if shop_id and table_name:
                    await log_conflict_async(
                        supabase=supabase,
                        shop_id=shop_id,
                        table_name=table_name,
                        record_id=record_id,
                        conflict_type=conflict.conflict_type,
                        details={
                            'attempt': attempt,
                            'original_error': str(e)
                        }
                    )
                
                # Verificar se deve fazer retry
                should_retry = (
                    conflict.conflict_type in config.retry_on_conflict_codes
                    and attempt < config.max_retries
                )
                
                if not should_retry:
                    raise conflict
                
                # Chamar callback
                if config.on_retry_callback:
                    config.on_retry_callback(attempt, conflict)
                
                # Calcular delay e esperar
                delay = config.get_delay(attempt)
                logger.warning(
                    f"Conflict detected (attempt {attempt}/{config.max_retries}). "
                    f"Retrying in {delay:.2f}s... - {e}"
                )
                
                await asyncio.sleep(delay)
            else:
                raise
    
    raise last_error or ConflictResolutionError(
        "Max retries exceeded",
        conflict_type=ConflictType.UNKNOWN
    )


# ============================================================================
# DECORATORS
# ============================================================================

def with_conflict_retry(
    supabase: Client,
    shop_id: str,
    table_name: str,
    config: Optional[RetryConfig] = None
):
    """
    Decorator para adicionar retry automático em caso de conflitos
    
    Args:
        supabase: Cliente Supabase para logging
        shop_id: ID da loja para logging
        table_name: Nome da tabela para logging
        config: Configuração de retry
        
    Example:
        @with_conflict_retry(supabase, shop_id="xxx", table_name="appointments")
        def update_appointment(appointment_id, updates, version):
            return supabase.table('appointments').update(updates).eq('id', appointment_id).eq('version', version).execute()
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            def operation():
                return func(*args, **kwargs)
            
            return handle_conflict_with_retry(
                supabase=supabase,
                operation=operation,
                config=config,
                shop_id=shop_id,
                table_name=table_name,
                record_id=kwargs.get('appointment_id') or kwargs.get('id')
            )
        return wrapper
    return decorator


def with_conflict_retry_async(
    supabase: Client,
    shop_id: str,
    table_name: str,
    config: Optional[RetryConfig] = None
):
    """
    Decorator assíncrono para adicionar retry automático em caso de conflitos
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            async def operation():
                return await func(*args, **kwargs)
            
            return await handle_conflict_with_retry_async(
                supabase=supabase,
                operation=operation,
                config=config,
                shop_id=shop_id,
                table_name=table_name,
                record_id=kwargs.get('appointment_id') or kwargs.get('id')
            )
        return wrapper
    return decorator


# ============================================================================
# FUNÇÕES DE BOOKING ATÔMICAS (WRAPPER)
# ============================================================================

def book_appointment_atomic_sync(
    supabase: Client,
    shop_id: str,
    client_id: str,
    employee_id: str,
    service_id: str,
    scheduled_at: str,
    version: int = 1,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Wrapper síncrono para book_appointment_atomic
    
    Args:
        supabase: Cliente Supabase
        shop_id: ID da loja
        client_id: ID do cliente
        employee_id: ID do funcionário
        service_id: ID do serviço
        scheduled_at: Data/hora do agendamento
        version: Versão inicial
        notes: Notas
        
    Returns:
        Resultado da operação
    """
    try:
        result = supabase.rpc('book_appointment_atomic', {
            'p_shop_id': shop_id,
            'p_client_id': client_id,
            'p_employee_id': employee_id,
            'p_service_id': service_id,
            'p_scheduled_at': scheduled_at,
            'p_version': version,
            'p_notes': notes
        })
        
        # Verificar conflito
        conflict = parse_atomic_result(result.data)
        if conflict:
            raise conflict
        
        return result.data
    except ConflictResolutionError:
        raise
    except Exception as e:
        logger.error(f"Error booking appointment: {e}")
        raise


async def book_appointment_atomic_async(
    supabase: Client,
    shop_id: str,
    client_id: str,
    employee_id: str,
    service_id: str,
    scheduled_at: str,
    version: int = 1,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """Versão assíncrona de book_appointment_atomic_sync"""
    return await asyncio.to_thread(
        book_appointment_atomic_sync,
        supabase, shop_id, client_id, employee_id, service_id,
        scheduled_at, version, notes
    )


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    # Enums
    'ConflictType',
    'AtomicResultCode',
    
    # Exception
    'ConflictResolutionError',
    
    # Data classes
    'RetryConfig',
    'ConflictStats',
    
    # Detection
    'detect_conflict',
    'detect_conflict_type',
    'parse_atomic_result',
    
    # Logging
    'log_conflict',
    'log_conflict_async',
    
    # Statistics
    'get_conflict_stats',
    'get_recent_conflicts',
    
    # Retry
    'handle_conflict_with_retry',
    'handle_conflict_with_retry_async',
    
    # Decorators
    'with_conflict_retry',
    'with_conflict_retry_async',
    
    # Atomic operations
    'book_appointment_atomic_sync',
    'book_appointment_atomic_async',
]
