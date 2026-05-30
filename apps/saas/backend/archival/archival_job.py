"""
BarberZap - Archival Job Module

BullMQ jobs for data archival operations.

Features:
- Async archival of clients, appointments, messages, activity logs
- Batch processing with progress tracking
- Retry logic with exponential backoff
- Statistics after archival
- Notifications on completion
- Support for dry runs
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
import json

from bullmq import Job, Worker
from bullmq.types import JobOptions

logger = logging.getLogger(__name__)


# ==================== Enums ====================

class ArchivalType(str, Enum):
    """Tipos de arquivamento suportados"""
    CLIENTS = 'clients'
    APPOINTMENTS = 'appointments'
    MESSAGES = 'messages'
    ACTIVITY_LOGS = 'activity_logs'
    ALL = 'all'


class ArchivalStatus(str, Enum):
    """Status de operação de arquivamento"""
    PENDING = 'pending'
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'
    FAILED = 'failed'
    CANCELLED = 'cancelled'


# ==================== Data Classes ====================

@dataclass
class ArchivalResult:
    """Resultado de uma operação de arquivamento"""
    archival_type: ArchivalType
    shop_id: Optional[str]
    success: bool
    total_to_archive: int = 0
    total_archived: int = 0
    duration_seconds: float = 0
    error_message: str = None
    metadata: Dict = field(default_factory=dict)
    details: List[Dict] = field(default_factory=list)
    started_at: datetime = None
    completed_at: datetime = None


@dataclass
class ArchiveJobData:
    """Dados requeridos para job de arquivamento"""
    archival_type: ArchivalType
    shop_id: Optional[str] = None
    older_than_months: int = 12
    batch_size: int = 1000
    dry_run: bool = False
    performed_by: str = 'system'
    scheduled_for: Optional[datetime] = None


# ==================== Archival Job Class ====================

class ArchivalJob:
    """
    BullMQ job para operações de arquivamento

    Features:
    - Arquivamento assíncrono de múltiplos tipos de tabelas
    - Processamento em batches para não bloquear
    - Retry logic com exponential backoff
    - Progress tracking
    - Estatísticas após completar
    - Notificações ao completar
    """

    # Nomes dos jobs
    JOB_NAME_ARCHIVE_CLIENTS = 'archive_clients'
    JOB_NAME_ARCHIVE_APPOINTMENTS = 'archive_appointments'
    JOB_NAME_ARCHIVE_MESSAGES = 'archive_messages'
    JOB_NAME_ARCHIVE_ACTIVITY_LOGS = 'archive_activity_logs'
    JOB_NAME_ARCHIVE_ALL = 'archive_all'

    # Configuração de retry
    MAX_RETRIES = 3
    RETRY_DELAY_MS = 5000
    RETRY_BACKOFF = True

    # Job timeout (longo para operações de arquivamento)
    JOB_TIMEOUT_MS = 300000  # 5 minutos

    # Configuração de batch
    DEFAULT_BATCH_SIZE = 1000
    MAX_BATCH_SIZE = 5000
    MIN_BATCH_SIZE = 100

    # Retenção padrão
    DEFAULT_CLIENTS_MONTHS = 24
    DEFAULT_APPOINTMENTS_MONTHS = 12
    DEFAULT_MESSAGES_MONTHS = 18
    DEFAULT_ACTIVITY_LOGS_MONTHS = 6

    def __init__(
        self,
        redis_connection: Any,
        supabase_client: Any = None,
        notification_service: Any = None,
    ):
        """
        Inicializar job processor de arquivamento

        Args:
            redis_connection: Conexão Redis para BullMQ
            supabase_client: Cliente Supabase para operações no DB
            notification_service: Serviço de notificações
        """
        self.redis_connection = redis_connection
        self.supabase = supabase_client
        self.notification_service = notification_service

        # Inicializar worker
        self.worker = Worker(
            redis_connection,
            self.JOB_NAME_ARCHIVE_ALL,
            self.process,
            {
                'concurrency': 2,  # Limite de 2 jobs concorrentes (intensivos em IO)
                'lockDuration': 60000,  # 1 minuto lock
            }
        )

        # Event handlers
        self.worker.on('completed', self.on_completed)
        self.worker.on('failed', self.on_failed)
        self.worker.on('progress', self.on_progress)

    async def close(self):
        """Fechar worker e conexões"""
        await self.worker.close()

    # =====================================================
    # JOB PROCESSING
    # =====================================================

    @staticmethod
    async def process(job: Job, token: str):
        """
        Processar um job de arquivamento

        Args:
            job: BullMQ job
            token: Job token
        """
        processor = ArchivalJob.__new__(ArchivalJob)
        return await processor._process_job(job)

    async def _process_job(self, job: Job) -> ArchivalResult:
        """Lógica interna de processamento do job"""
        job_data = ArchiveJobData(**job.data)
        start_time = datetime.now(timezone.utc)

        logger.info(f"Starting archival job for type {job_data.archival_type}, shop {job_data.shop_id}")

        result = ArchivalResult(
            archival_type=job_data.archival_type,
            shop_id=job_data.shop_id,
            success=False,
            started_at=start_time,
        )

        try:
            # Atualizar status para in_progress
            await self._update_job_status(job, 'in_progress', 0)

            # Registrar início de operação
            operation_id = await self._log_operation_start(job_data)

            # Executar arquivamento baseado no tipo
            if job_data.archival_type in [
                ArchivalType.CLIENTS,
                ArchivalType.ALL
            ]:
                clients_result = await self.archive_clients(
                    shop_id=job_data.shop_id,
                    older_than_months=self.DEFAULT_CLIENTS_MONTHS if job_data.older_than_months is None else job_data.older_than_months,
                    batch_size=job_data.batch_size,
                    dry_run=job_data.dry_run,
                    performed_by=job_data.performed_by
                )
                result.details.append(clients_result)
                result.total_archived += clients_result.get('total_archived', 0)
                result.total_to_archive += clients_result.get('total_to_archive', 0)

                # Atualizar progress
                await self._update_job_status(job, 'in_progress', 25)

            if job_data.archival_type in [
                ArchivalType.APPOINTMENTS,
                ArchivalType.ALL
            ]:
                appointments_result = await self.archive_appointments(
                    shop_id=job_data.shop_id,
                    older_than_months=job_data.older_than_months,
                    batch_size=job_data.batch_size,
                    dry_run=job_data.dry_run,
                    performed_by=job_data.performed_by
                )
                result.details.append(appointments_result)
                result.total_archived += appointments_result.get('total_archived', 0)
                result.total_to_archive += appointments_result.get('total_to_archive', 0)

                # Atualizar progress
                await self._update_job_status(job, 'in_progress', 50)

            if job_data.archival_type in [
                ArchivalType.MESSAGES,
                ArchivalType.ALL
            ]:
                messages_result = await self.archive_messages(
                    shop_id=job_data.shop_id,
                    older_than_months=self.DEFAULT_MESSAGES_MONTHS if job_data.older_than_months is None else job_data.older_than_months,
                    batch_size=job_data.batch_size,
                    dry_run=job_data.dry_run,
                    performed_by=job_data.performed_by
                )
                result.details.append(messages_result)
                result.total_archived += messages_result.get('total_archived', 0)
                result.total_to_archive += messages_result.get('total_to_archive', 0)

                # Atualizar progress
                await self._update_job_status(job, 'in_progress', 75)

            if job_data.archival_type in [
                ArchivalType.ACTIVITY_LOGS,
                ArchivalType.ALL
            ]:
                logs_result = await self.archive_activity_logs(
                    shop_id=job_data.shop_id,
                    older_than_months=self.DEFAULT_ACTIVITY_LOGS_MONTHS if job_data.older_than_months is None else job_data.older_than_months,
                    batch_size=job_data.batch_size,
                    dry_run=job_data.dry_run,
                    performed_by=job_data.performed_by
                )
                result.details.append(logs_result)
                result.total_archived += logs_result.get('total_archived', 0)
                result.total_to_archive += logs_result.get('total_to_archive', 0)

                # Atualizar progress
                await self._update_job_status(job, 'in_progress', 100)

            # Calcular duração
            result.duration_seconds = (datetime.now(timezone.utc) - start_time).total_seconds()
            result.success = True
            result.completed_at = datetime.now(timezone.utc)

            # Registrar completude
            await self._log_operation_complete(
                operation_id,
                'completed',
                result.total_archived,
                metadata={
                    'job_id': job.id,
                    'details': result.details,
                    'duration_seconds': result.duration_seconds,
                }
            )

            # Atualizar materialized views
            await self._refresh_stats_views()

            # Enviar notificação
            if self.notification_service:
                await self._send_notification(result)

            logger.info(f"Archival job completed: {result}")

        except Exception as e:
            logger.error(f"Archival job failed: {e}")
            result.success = False
            result.error_message = str(e)
            result.duration_seconds = (datetime.now(timezone.utc) - start_time).total_seconds()
            result.completed_at = datetime.now(timezone.utc)

            # Registrar falha
            if 'operation_id' in locals():
                await self._log_operation_complete(
                    operation_id,
                    'failed',
                    result.total_archived,
                    error_message=str(e)
                )

            # Raise para BullMQ retry
            raise

        return result

    # =====================================================
    # ARCHIVAL OPERATIONS
    # =====================================================

    async def archive_clients(
        self,
        shop_id: Optional[str],
        older_than_months: int = 24,
        batch_size: int = 1000,
        dry_run: bool = False,
        performed_by: str = 'system'
    ) -> Dict[str, Any]:
        """
        Arquivar clientes inativos (sem agendamento há 24+ meses)

        Args:
            shop_id: ID da shop (opcional)
            older_than_months: Meses de inatividade
            batch_size: Tamanho do batch
            dry_run: Simular sem alterações
            performed_by: Quem está executando
        """
        if not self.supabase:
            return {'error': 'Supabase client not configured'}

        logger.info(f"Archiving clients older than {older_than_months} months")

        try:
            # Chamar stored procedure no Supabase
            params = {
                'p_older_than_months': older_than_months,
                'p_shop_id': shop_id,
                'p_batch_size': batch_size,
                'p_dry_run': dry_run,
                'p_performed_by': performed_by
            }

            result = (self.supabase.rpc('procedure_archive_clients', params)
                     .execute())

            return {
                'success': True,
                'archival_type': 'clients',
                'shop_id': shop_id,
                **(result.data if hasattr(result, 'data') else {})
            }

        except Exception as e:
            logger.error(f"Failed to archive clients: {e}")
            return {
                'success': False,
                'archival_type': 'clients',
                'shop_id': shop_id,
                'error': str(e)
            }

    async def archive_appointments(
        self,
        shop_id: Optional[str],
        older_than_months: int = 12,
        batch_size: int = 1000,
        dry_run: bool = False,
        performed_by: str = 'system'
    ) -> Dict[str, Any]:
        """
        Arquivar agendamentos completados/cancelados (12+ meses)
        """
        if not self.supabase:
            return {'error': 'Supabase client not configured'}

        logger.info(f"Archiving appointments older than {older_than_months} months")

        try:
            params = {
                'p_older_than_months': older_than_months,
                'p_shop_id': shop_id,
                'p_batch_size': batch_size,
                'p_dry_run': dry_run,
                'p_performed_by': performed_by
            }

            result = (self.supabase.rpc('procedure_archive_appointments', params)
                     .execute())

            return {
                'success': True,
                'archival_type': 'appointments',
                'shop_id': shop_id,
                **(result.data if hasattr(result, 'data') else {})
            }

        except Exception as e:
            logger.error(f"Failed to archive appointments: {e}")
            return {
                'success': False,
                'archival_type': 'appointments',
                'shop_id': shop_id,
                'error': str(e)
            }

    async def archive_messages(
        self,
        shop_id: Optional[str],
        older_than_months: int = 18,
        batch_size: int = 1000,
        dry_run: bool = False,
        performed_by: str = 'system'
    ) -> Dict[str, Any]:
        """
        Arquivar mensagens antigas (18+ meses)
        """
        if not self.supabase:
            return {'error': 'Supabase client not configured'}

        logger.info(f"Archiving messages older than {older_than_months} months")

        try:
            params = {
                'p_older_than_months': older_than_months,
                'p_shop_id': shop_id,
                'p_batch_size': batch_size,
                'p_dry_run': dry_run,
                'p_performed_by': performed_by
            }

            result = (self.supabase.rpc('procedure_archive_messages', params)
                     .execute())

            return {
                'success': True,
                'archival_type': 'messages',
                'shop_id': shop_id,
                **(result.data if hasattr(result, 'data') else {})
            }

        except Exception as e:
            logger.error(f"Failed to archive messages: {e}")
            return {
                'success': False,
                'archival_type': 'messages',
                'shop_id': shop_id,
                'error': str(e)
            }

    async def archive_activity_logs(
        self,
        shop_id: Optional[str],
        older_than_months: int = 6,
        batch_size: int = 5000,
        dry_run: bool = False,
        performed_by: str = 'system'
    ) -> Dict[str, Any]:
        """
        Arquivar logs de atividade (6+ meses)
        """
        if not self.supabase:
            return {'error': 'Supabase client not configured'}

        logger.info(f"Archiving activity logs older than {older_than_months} months")

        try:
            params = {
                'p_older_than_months': older_than_months,
                'p_shop_id': shop_id,
                'p_batch_size': batch_size,
                'p_dry_run': dry_run,
                'p_performed_by': performed_by
            }

            result = (self.supabase.rpc('procedure_archive_activity_logs', params)
                     .execute())

            return {
                'success': True,
                'archival_type': 'activity_logs',
                'shop_id': shop_id,
                **(result.data if hasattr(result, 'data') else {})
            }

        except Exception as e:
            logger.error(f"Failed to archive activity logs: {e}")
            return {
                'success': False,
                'archival_type': 'activity_logs',
                'shop_id': shop_id,
                'error': str(e)
            }

    async def archive_by_type(
        self,
        table_name: str,
        older_than_months: int = 12,
        batch_size: int = 1000,
        shop_id: Optional[str] = None,
        dry_run: bool = False,
        performed_by: str = 'system'
    ) -> Dict[str, Any]:
        """
        Arquivar por tipo de tabela usando a função universal
        """
        if not self.supabase:
            return {'error': 'Supabase client not configured'}

        try:
            params = {
                'p_table_type': table_name,
                'p_older_than_months': older_than_months,
                'p_shop_id': shop_id,
                'p_dry_run': dry_run,
                'p_performed_by': performed_by
            }

            result = (self.supabase.rpc('procedure_archive_by_type', params)
                     .execute())

            return {
                'success': True,
                'archival_type': table_name,
                'shop_id': shop_id,
                **(result.data if hasattr(result, 'data') else {})
            }

        except Exception as e:
            logger.error(f"Failed to archive {table_name}: {e}")
            return {
                'success': False,
                'archival_type': table_name,
                'shop_id': shop_id,
                'error': str(e)
            }

    # =====================================================
    # DATABASE HELPERS
    # =====================================================

    async def _log_operation_start(
        self,
        job_data: ArchiveJobData
    ) -> Optional[str]:
        """Registrar início de operação de arquivamento"""
        if not self.supabase:
            return None

        try:
            result = (self.supabase.rpc('log_archival_operation_start', {
                'p_operation_type': 'archive',
                'p_table_name': job_data.archival_type.value,
                'p_criteria': {
                    'older_than_months': job_data.older_than_months,
                    'shop_id': job_data.shop_id,
                },
                'p_performed_by': job_data.performed_by,
                'p_dry_run': job_data.dry_run
            }).execute())

            return result.data if hasattr(result, 'data') else None

        except Exception as e:
            logger.error(f"Failed to log operation start: {e}")
            return None

    async def _log_operation_complete(
        self,
        operation_id: Optional[str],
        status: str,
        records_affected: int,
        error_message: str = None,
        metadata: Dict = None
    ):
        """Registrar completude de operação"""
        if not self.supabase or not operation_id:
            return

        try:
            self.supabase.rpc('log_archival_operation_complete', {
                'p_operation_id': operation_id,
                'p_status': status,
                'p_records_affected': records_affected,
                'p_error_message': error_message,
                'p_metadata': metadata or {}
            }).execute()

        except Exception as e:
            logger.error(f"Failed to log operation complete: {e}")

    async def _refresh_stats_views(self):
        """Atualizar materialized views de estatísticas"""
        if not self.supabase:
            return

        try:
            self.supabase.rpc('refresh_all_materialized_views').execute()
            logger.info("Materialized views refreshed after archival")
        except Exception as e:
            logger.warning(f"Failed to refresh materialized views: {e}")

    # =====================================================
    # NOTIFICATIONS
    # =====================================================

    async def _send_notification(self, result: ArchivalResult):
        """Enviar notificação de completude"""
        if not self.notification_service:
            return

        try:
            message = self._format_notification_message(result)

            # Enviar notificação para superadmins
            await self.notification_service.send_to_role(
                role='superadmin',
                subject=f'Data Archival Completed: {result.archival_type.value}',
                message=message,
                type='archival'
            )

        except Exception as e:
            logger.error(f"Failed to send notification: {e}")

    def _format_notification_message(self, result: ArchivalResult) -> str:
        """Formatar mensagem de notificação"""
        lines = [
            f"Archival operation completed successfully!",
            f"",
            f"Type: {result.archival_type.value}",
            f"Shop ID: {result.shop_id or 'All shops'}",
            f"Records archived: {result.total_archived:,}",
            f"Duration: {result.duration_seconds:.2f} seconds",
            f"Started at: {result.started_at.isoformat()}",
            f"Completed at: {result.completed_at.isoformat()}",
        ]

        if result.details:
            lines.append(f"\nDetails:")
            for detail in result.details:
                lines.append(f"  - {detail.get('archival_type', 'unknown')}: {detail.get('total_archived', 0)} archived")

        return "\n".join(lines)

    # =====================================================
    # JOB QUEUEING
    # =====================================================

    @staticmethod
    async def queue_archive_job(
        queue: Any,
        archival_type: ArchivalType,
        shop_id: Optional[str] = None,
        older_than_months: int = None,
        batch_size: int = None,
        dry_run: bool = False,
        performed_by: str = 'system',
        delay_ms: int = 0,
    ) -> Job:
        """
        Enfileirar job de arquivamento

        Args:
            queue: BullMQ queue
            archival_type: Tipo de arquivamento
            shop_id: ID da shop (opcional)
            older_than_months: Meses de retenção
            batch_size: Tamanho do batch
            dry_run: Simular sem alterações
            performed_by: Quem está executando
            delay_ms: Delay antes de iniciar

        Returns:
            Job criado
        """
        job_data = ArchiveJobData(
            archival_type=archival_type,
            shop_id=shop_id,
            older_than_months=older_than_months,
            batch_size=batch_size or ArchivalJob.DEFAULT_BATCH_SIZE,
            dry_run=dry_run,
            performed_by=performed_by,
        )

        options: JobOptions = {
            'attempts': ArchivalJob.MAX_RETRIES,
            'backoff': {
                'type': 'exponential',
                'delay': ArchivalJob.RETRY_DELAY_MS,
            },
            'timeout': ArchivalJob.JOB_TIMEOUT_MS,
            'delay': delay_ms,
        }

        job = await queue.add(
            ArchivalJob.JOB_NAME_ARCHIVE_ALL,
            job_data.__dict__,
            options
        )

        logger.info(f"Queued archival job {job.id} for type {archival_type}")
        return job

    # =====================================================
    # EVENT HANDLERS
    # =====================================================

    async def on_completed(self, job: Job, result: ArchivalResult):
        """Handler para job completado"""
        logger.info(f"Job {job.id} completed: {result}")

    async def on_failed(self, job: Job, error: Exception):
        """Handler para job falhado"""
        logger.error(f"Job {job.id} failed: {error}")

    async def on_progress(self, job: Job, progress: int):
        """Handler para progresso do job"""
        logger.debug(f"Job {job.id} progress: {progress}%")

    async def _update_job_status(self, job: Job, status: str, progress: int):
        """Atualizar status e progresso do job"""
        await job.updateProgress(progress)
        logger.debug(f"Job {job.id} status: {status}, progress: {progress}%")


# ==================== HELPER FUNCTIONS ====================

async def queue_clients_archive(
    queue: Any,
    shop_id: Optional[str] = None,
    months: int = 24,
    dry_run: bool = False,
    performed_by: str = 'system',
) -> Job:
    """Helper para enfileirar arquivamento de clientes"""
    return await ArchivalJob.queue_archive_job(
        queue,
        archival_type=ArchivalType.CLIENTS,
        shop_id=shop_id,
        older_than_months=months,
        dry_run=dry_run,
        performed_by=performed_by,
    )


async def queue_appointments_archive(
    queue: Any,
    shop_id: Optional[str] = None,
    months: int = 12,
    dry_run: bool = False,
    performed_by: str = 'system',
) -> Job:
    """Helper para enfileirar arquivamento de agendamentos"""
    return await ArchivalJob.queue_archive_job(
        queue,
        archival_type=ArchivalType.APPOINTMENTS,
        shop_id=shop_id,
        older_than_months=months,
        dry_run=dry_run,
        performed_by=performed_by,
    )


async def queue_messages_archive(
    queue: Any,
    shop_id: Optional[str] = None,
    months: int = 18,
    dry_run: bool = False,
    performed_by: str = 'system',
) -> Job:
    """Helper para enfileirar arquivamento de mensagens"""
    return await ArchivalJob.queue_archive_job(
        queue,
        archival_type=ArchivalType.MESSAGES,
        shop_id=shop_id,
        older_than_months=months,
        dry_run=dry_run,
        performed_by=performed_by,
    )


async def queue_activity_logs_archive(
    queue: Any,
    shop_id: Optional[str] = None,
    months: int = 6,
    dry_run: bool = False,
    performed_by: str = 'system',
) -> Job:
    """Helper para enfileirar arquivamento de logs"""
    return await ArchivalJob.queue_archive_job(
        queue,
        archival_type=ArchivalType.ACTIVITY_LOGS,
        shop_id=shop_id,
        older_than_months=months,
        dry_run=dry_run,
        performed_by=performed_by,
    )


async def queue_all_archive(
    queue: Any,
    shop_id: Optional[str] = None,
    dry_run: bool = False,
    performed_by: str = 'system',
) -> Job:
    """Helper para enfileirar arquivamento completo"""
    return await ArchivalJob.queue_archive_job(
        queue,
        archival_type=ArchivalType.ALL,
        shop_id=shop_id,
        dry_run=dry_run,
        performed_by=performed_by,
    )
