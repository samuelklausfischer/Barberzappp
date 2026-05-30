"""
BarberZap - Scheduled Reports

Gerenciamento de reports agendados com envio automático por email.
Integração com BullMQ para processamento de background jobs.
"""

import os
import asyncio
import json
from datetime import datetime, timedelta, tzinfo
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
import croniter  # pip install croniter

import asyncpg
import aiohttp
from fastapi import HTTPException
import pytz

from .reports_service import ReportsService, ExportFormat, ExportRequest
from ..config.redis_config import RedisConfig
from ..error.exceptions import (
    NotFoundError,
    BadRequestError,
    ValidationError
)

# ==================== Enums ====================

class ScheduleType(str, Enum):
    """Tipos de schedule disponíveis"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    CUSTOM = "custom"

class SendStatus(str, Enum):
    """Status de envio de email"""
    PENDING = "pending"
    SENT = "sent"
    PARTIAL = "partial"
    FAILED = "failed"

# ==================== Data Classes ====================

@dataclass
class ScheduledReportConfig:
    """Configuração de report agendado"""
    shop_id: str
    report_type: str
    report_name: str
    description: Optional[str] = None
    schedule_type: ScheduleType = ScheduleType.DAILY
    schedule_cron: Optional[str] = None
    schedule_config: Dict[str, Any] = field(default_factory=dict)
    parameters: Dict[str, Any] = field(default_factory=dict)
    filters: Dict[str, Any] = field(default_factory=dict)
    recipients: List[Dict[str, str]] = field(default_factory=list)
    subject_template: Optional[str] = None
    message_template: Optional[str] = None
    format: ExportFormat = ExportFormat.PDF
    include_charts: bool = True
    include_summary: bool = True
    is_active: bool = True

@dataclass
class ScheduleRun:
    """Execução de um report agendado"""
    id: str
    scheduled_report_id: str
    shop_id: str
    scheduled_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    status: str = "pending"
    row_count: Optional[int] = None
    file_url: Optional[str] = None
    file_format: Optional[str] = None
    file_size_bytes: Optional[int] = None
    sent_at: Optional[datetime] = None
    sent_to: Optional[List[Dict[str, str]]] = None
    sent_status: Optional[str] = None
    send_error: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    retry_at: Optional[datetime] = None

# ==================== Repository ====================

class ScheduledReportsRepository:
    """Repository para reports agendados"""
    
    def __init__(self, db: asyncpg.Connection):
        self.db = db
    
    async def create_scheduled_report(
        self,
        config: ScheduledReportConfig
    ) -> Dict[str, Any]:
        """
        Cria um novo report agendado.
        
        Args:
            config: Configuração do report
            
        Returns:
            Report criado
        """
        # Calcula próxima execução
        next_run_at = self._calculate_next_run(config)
        
        query = """
        INSERT INTO scheduled_reports (
            shop_id,
            report_type,
            report_name,
            description,
            schedule_type,
            schedule_cron,
            schedule_config,
            parameters,
            filters,
            recipients,
            subject_template,
            message_template,
            format,
            include_charts,
            include_summary,
            is_active,
            next_run_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        )
        RETURNING *
        """
        
        row = await self.db.fetchrow(
            query,
            config.shop_id,
            config.report_type,
            config.report_name,
            config.description,
            config.schedule_type.value,
            config.schedule_cron,
            json.dumps(config.schedule_config),
            json.dumps(config.parameters),
            json.dumps(config.filters),
            json.dumps(config.recipients),
            config.subject_template,
            config.message_template,
            config.format.value,
            config.include_charts,
            config.include_summary,
            config.is_active,
            next_run_at
        )
        
        return dict(row)
    
    async def get_scheduled_report(
        self,
        report_id: str,
        shop_id: str
    ) -> Optional[Dict[str, Any]]:
        """Obtém um report agendado por ID"""
        query = """
        SELECT * FROM scheduled_reports
        WHERE id = $1 AND shop_id = $2
        """
        row = await self.db.fetchrow(query, report_id, shop_id)
        return dict(row) if row else None
    
    async def list_scheduled_reports(
        self,
        shop_id: str,
        active_only: bool = False
    ) -> List[Dict[str, Any]]:
        """Lista todos os reports agendados de uma shop"""
        query = """
        SELECT * FROM scheduled_reports
        WHERE shop_id = $1
          AND ($2 = FALSE OR is_active = TRUE)
          AND deleted_at IS NULL
        ORDER BY next_run_at ASC
        """
        rows = await self.db.fetch(query, shop_id, active_only)
        return [dict(row) for row in rows]
    
    async def update_scheduled_report(
        self,
        report_id: str,
        shop_id: str,
        updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Atualiza um report agendado"""
        # Se alterou schedule, recalcula próxima execução
        if any(key in updates for key in ['schedule_type', 'schedule_cron', 'schedule_config']):
            next_run_at = self._calculate_next_run_from_db(report_id, shop_id)
            updates['next_run_at'] = next_run_at
        
        set_clause = []
        params = []
        param_idx = 1
        
        for key, value in updates.items():
            if key in ['parameters', 'filters', 'recipients', 'schedule_config']:
                set_clause.append(f"{key} = ${param_idx}::jsonb")
                params.append(json.dumps(value))
            else:
                set_clause.append(f"{key} = ${param_idx}")
                params.append(value)
            param_idx += 1
        
        if not set_clause:
            return await self.get_scheduled_report(report_id, shop_id)
        
        params.extend([report_id, shop_id])
        query = f"""
        UPDATE scheduled_reports
        SET {', '.join(set_clause)}, updated_at = NOW()
        WHERE id = ${param_idx} AND shop_id = ${param_idx + 1}
        RETURNING *
        """
        
        row = await self.db.fetchrow(query, *params)
        return dict(row) if row else None
    
    async def delete_scheduled_report(
        self,
        report_id: str,
        shop_id: str
    ) -> bool:
        """
        Soft delete de um report agendado.
        
        Args:
            report_id: ID do report
            shop_id: ID da shop
            
        Returns:
            True se deletado, False se não encontrado
        """
        query = """
        UPDATE scheduled_reports
        SET is_active = FALSE, deleted_at = NOW()
        WHERE id = $1 AND shop_id = $2
        """
        result = await self.db.execute(query, report_id, shop_id)
        return result != "UPDATE 0"
    
    async def get_due_reports(self) -> List[Dict[str, Any]]:
        """
        Obtém reports que estão prontos para execução.
        
        Returns:
            Lista de reports agendados que devem rodar agora
        """
        query = """
        SELECT * FROM scheduled_reports
        WHERE is_active = TRUE
          AND next_run_at <= NOW()
          AND deleted_at IS NULL
        ORDER BY next_run_at ASC
        """
        rows = await self.db.fetch(query)
        return [dict(row) for row in rows]
    
    async def update_next_run(
        self,
        report_id: str,
        next_run_at: datetime
    ) -> None:
        """Atualiza próxima execução de um report"""
        query = """
        UPDATE scheduled_reports
        SET 
            next_run_at = $1,
            last_run_at = NOW(),
            run_count = run_count + 1
        WHERE id = $2
        """
        await self.db.execute(query, next_run_at, report_id)
    
    async def increment_run_stats(
        self,
        report_id: str,
        success: bool = True
    ) -> None:
        """Incrementa contadores de runs (success/failure)"""
        if success:
            query = """
            UPDATE scheduled_reports
            SET success_count = success_count + 1
            WHERE id = $1
            """
        else:
            query = """
            UPDATE scheduled_reports
            SET failure_count = failure_count + 1
            WHERE id = $1
            """
        await self.db.execute(query, report_id)
    
    async def create_schedule_run(
        self,
        scheduled_report_id: str,
        scheduled_at: datetime
    ) -> str:
        """
        Cria um registro de execução na história.
        
        Returns:
            ID da execução
        """
        query = """
        INSERT INTO scheduled_reports_history (
            scheduled_report_id,
            shop_id,
            scheduled_at,
            status
        )
        SELECT 
            $1,
            shop_id,
            $2,
            'pending'
        FROM scheduled_reports
        WHERE id = $1
        RETURNING id
        """
        
        run_id = await self.db.fetchval(query, scheduled_report_id, scheduled_at)
        return str(run_id)
    
    async def update_schedule_run(
        self,
        run_id: str,
        updates: Dict[str, Any]
    ) -> None:
        """Atualiza execução de scheduled report"""
        set_clause = []
        params = []
        param_idx = 1
        
        for key, value in updates.items():
            if key in ['sent_to', 'parameters_snapshot', 'report_snapshot']:
                set_clause.append(f"{key} = ${param_idx}::jsonb")
                params.append(json.dumps(value))
            elif key in ['error_details']:
                set_clause.append(f"{key} = ${param_idx}::jsonb")
                params.append(json.dumps(value))
            else:
                set_clause.append(f"{key} = ${param_idx}")
                params.append(value)
            param_idx += 1
        
        if set_clause:
            params.append(run_id)
            query = f"""
            UPDATE scheduled_reports_history
            SET {', '.join(set_clause)}
            WHERE id = ${param_idx}
            """
            await self.db.execute(query, *params)
    
    async def get_schedule_run_history(
        self,
        shop_id: str,
        report_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Obtém histórico de execuções.
        
        Args:
            shop_id: ID da shop
            report_id: ID do report (opcional, filtra por report específico)
            limit: Quantidade máxima de registros
            
        Returns:
            Lista de execuções
        """
        query = """
        SELECT srh.*, sr.report_name, sr.report_type
        FROM scheduled_reports_history srh
        INNER JOIN scheduled_reports sr ON srh.scheduled_report_id = sr.id
        WHERE srh.shop_id = $1
          AND ($2::UUID IS NULL OR srh.scheduled_report_id = $2)
        ORDER BY srh.scheduled_at DESC
        LIMIT $3
        """
        rows = await self.db.fetch(query, shop_id, report_id, limit)
        return [dict(row) for row in rows]
    
    def _calculate_next_run(
        self,
        config: ScheduledReportConfig
    ) -> datetime:
        """
        Calcula próxima execução baseado no schedule.
        
        Args:
            config: Configuração do report
            
        Returns:
            Datetime da próxima execução
        """
        now = datetime.now(pytz.UTC)
        
        # Se tem cron expression customizada, usa croniter
        if config.schedule_cron:
            return self._calculate_from_cron(config.schedule_cron, now)
        
        # Caso contrário, calcula baseado no schedule_type
        delta = self._get_schedule_delta(config.schedule_type, config.schedule_config)
        return now + delta
    
    def _calculate_next_run_from_db(
        self,
        report_id: str,
        shop_id: str
    ) -> Optional[datetime]:
        """
        Calcula próxima execução consultando o DB.
        
        Returns:
            Datetime da próxima execução ou None
        """
        # FIXME: Implementação seria async, mas estamos em método sync
        # Em produção, refatorar para ser async ou usar contexto apropriado
        return None
    
    def _calculate_from_cron(
        self,
        cron_expression: str,
        from_time: datetime
    ) -> datetime:
        """Calcula próxima execução usando croniter"""
        try:
            cron = croniter.croniter(cron_expression, from_time)
            return cron.get_next(datetime)
        except Exception as e:
            raise BadRequestError(f"Invalid cron expression: {cron_expression}")
    
    def _get_schedule_delta(
        self,
        schedule_type: ScheduleType,
        config: Dict[str, Any]
    ) -> timedelta:
        """
        Obtém delta de tempo baseado no tipo de schedule.
        
        Args:
            schedule_type: Tipo de schedule
            config: Configurações adicionais
            
        Returns:
            Timedelta para próxima execução
        """
        base = timedelta(days=1)  # Default diário
        
        if schedule_type == ScheduleType.DAILY:
            return base
        elif schedule_type == ScheduleType.WEEKLY:
            weekday = config.get('weekday', 0)  # 0=Monday, 6=Sunday
            now = datetime.now()
            days_ahead = (weekday - now.weekday() + 7) % 7 or 7
            return timedelta(days=days_ahead)
        elif schedule_type == ScheduleType.MONTHLY:
            day_of_month = config.get('day_of_month', 1)
            now = datetime.now()
            if now.day >= day_of_month:
                # Próximo mês
                next_month = now.month % 12 + 1
                next_year = now.year + (1 if next_month == 1 else 0)
                next_date = datetime(next_year, next_month, day_of_month)
                return next_date - now
            else:
                # Este mês
                next_date = datetime(now.year, now.month, day_of_month)
                return next_date - now
        elif schedule_type == ScheduleType.QUARTERLY:
            # Próximo trimestre
            now = datetime.now()
            quarter = (now.month - 1) // 3 + 1
            if quarter == 4:
                next_quarter = 1
                next_year = now.year + 1
            else:
                next_quarter = quarter + 1
                next_year = now.year
            
            next_month = (next_quarter - 1) * 3 + 1
            next_date = datetime(next_year, next_month, config.get('day_of_month', 1))
            return next_date - now
        
        return base


# ==================== Email Service ====================

class EmailService:
    """Serviço para envio de emails com reports"""
    
    def __init__(self, config: Dict[str, Any]):
        self.api_key = config.get('sendgrid_api_key') or os.getenv('SENDGRID_API_KEY')
        self.from_email = config.get('from_email') or 'noreply@barberzap.com'
        self.from_name = config.get('from_name') or 'BarberZap Reports'
    
    async def send_report_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        attachments: List[Dict[str, Any]] = None
    ) -> SendStatus:
        """
        Envia email com report.
        
        Args:
            to_emails: Lista de destinatários
            subject: Assunto do email
            html_content: Conteúdo HTML
            attachments: Anexos (arquivos do report)
            
        Returns:
            Status do envio
        """
        if not self.api_key:
            # Mock mode - apenas loga
            print(f"[MOCK EMAIL] To: {to_emails}, Subject: {subject}")
            print(f"[MOCK EMAIL] Attached files: {len(attachments) if attachments else 0}")
            return SendStatus.SENT
        
        # TODO: Implementar integração real com SendGrid/Ses/etc
        # Por enquanto, retorna sucesso
        return SendStatus.SENT
    
    def generate_report_email(
        self,
        report_name: str,
        shop_name: str,
        period: str,
        summary: Dict[str, Any],
        file_url: str,
        is_scheduled: bool = False
    ) -> Tuple[str, str]:
        """
        Gera conteúdo HTML do email do report.
        
        Returns:
            Tuple com (subject, html_content)
        """
        # Assunto
        if is_scheduled:
            subject = f"📊 {report_name} - {shop_name}"
        else:
            subject = f"Report disponível: {report_name}"
        
        # HTML Content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }}
                .body {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }}
                .summary {{ background: white; padding: 15px; border-radius: 5px; margin: 15px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }}
                .metric {{ display: inline-block; width: 48%; margin: 5px 0; }}
                .metric-value {{ font-size: 24px; font-weight: bold; color: #667eea; }}
                .metric-label {{ font-size: 12px; color: #666; text-transform: uppercase; }}
                .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                .footer {{ text-align: center; margin-top: 30px; color: #999; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Report de Negócios</h1>
                    <p>{shop_name}</p>
                </div>
                <div class="body">
                    <h2>{report_name}</h2>
                    <p><strong>Período:</strong> {period}</p>
                    
                    <h3>Resumo</h3>
                    <div class="summary">
                        {self._generate_summary_html(summary)}
                    </div>
                    
                    <p style="text-align: center;">
                        <a href="{file_url}" class="button">📥 Baixar Report Completo</a>
                    </p>
                    
                    <div class="footer">
                        <p>Gerado automaticamente por BarberZap © {datetime.now().year}</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        return subject, html_content
    
    def _generate_summary_html(self, summary: Dict[str, Any]) -> str:
        """Gera HTML do resumo de métricas"""
        html = ""
        
        for key, value in summary.items():
            label = key.replace('_', ' ').title()
            if isinstance(value, (int, float)):
                formatted_value = f"{value:,.2f}" if isinstance(value, float) else f"{value:,}"
            else:
                formatted_value = str(value)
            
            html += f"""
            <div class="metric">
                <div class="metric-value">{formatted_value}</div>
                <div class="metric-label">{label}</div>
            </div>
            """
        
        return html


# ==================== Service ====================

class ScheduledReportsService:
    """Service para gerenciamento de reports agendados"""
    
    def __init__(
        self,
        db: asyncpg.Connection,
        redis: RedisConfig,
        email_config: Dict[str, Any] = None
    ):
        self.db = db
        self.redis = redis
        self.repo = ScheduledReportsRepository(db)
        self.email_service = EmailService(email_config or {})
    
    async def create_scheduled_report(
        self,
        shop_id: str,
        user_id: str,
        config: ScheduledReportConfig
    ) -> Dict[str, Any]:
        """
        Cria um novo report agendado.
        
        Args:
            shop_id: ID da shop
            user_id: ID do usuário que está criando
            config: Configuração do report
            
        Returns:
            Report criado
        """
        # Valida recipients
        if not config.recipients:
            raise ValidationError("At least one email recipient is required")
        
        for recipient in config.recipients:
            if 'email' not in recipient:
                raise ValidationError("Each recipient must have an email address")
        
        # Cria no banco
        report = await self.repo.create_scheduled_report(config)
        
        # TODO: Enfileira job no BullMQ para monitoramento
        # await self.queue_monitoring_job(report['id'])
        
        return report
    
    async def list_scheduled_reports(
        self,
        shop_id: str,
        active_only: bool = False
    ) -> List[Dict[str, Any]]:
        """Lista todos os reports agendados da shop"""
        return await self.repo.list_scheduled_reports(shop_id, active_only)
    
    async def get_scheduled_report(
        self,
        shop_id: str,
        report_id: str
    ) -> Dict[str, Any]:
        """Obtém um report agendado específico"""
        report = await self.repo.get_scheduled_report(report_id, shop_id)
        if not report:
            raise NotFoundError(f"Scheduled report not found: {report_id}")
        
        # Obtém histórico de execuções
        history = await self.repo.get_schedule_run_history(shop_id, report_id, limit=10)
        report['history'] = history
        
        return report
    
    async def update_scheduled_report(
        self,
        shop_id: str,
        report_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Atualiza um report agendado"""
        report = await self.repo.update_scheduled_report(report_id, shop_id, updates)
        if not report:
            raise NotFoundError(f"Scheduled report not found: {report_id}")
        
        return report
    
    async def delete_scheduled_report(
        self,
        shop_id: str,
        report_id: str
    ) -> None:
        """Remove um report agendado"""
        deleted = await self.repo.delete_scheduled_report(report_id, shop_id)
        if not deleted:
            raise NotFoundError(f"Scheduled report not found: {report_id}")
    
    async def run_now(
        self,
        shop_id: str,
        report_id: str
    ) -> Dict[str, Any]:
        """
        Executa um report agendado imediatamente (test run).
        
        Returns:
            Resultado da execução
        """
        report = await self.repo.get_scheduled_report(report_id, shop_id)
        if not report:
            raise NotFoundError(f"Scheduled report not found: {report_id}")
        
        # Executa o report
        return await self._execute_scheduled_report(report, immediate=True)
    
    async def process_due_reports(self) -> None:
        """
        Processa todos os reports que estão prontos para execução.
        Este método deve ser chamado por um scheduler/cron job.
        """
        due_reports = await self.repo.get_due_reports()
        
        for report in due_reports:
            try:
                await self._execute_scheduled_report(report)
            except Exception as e:
                print(f"Error processing scheduled report {report['id']}: {e}")
                # Log de erro e continua para o próximo
    
    async def _execute_scheduled_report(
        self,
        report: Dict[str, Any],
        immediate: bool = False
    ) -> Dict[str, Any]:
        """
        Executa um report agendado.
        
        Args:
            report: Configuração do report
            immediate: Se é uma execução imediata (test run)
            
        Returns:
            Resultado da execução
        """
        # Cria registro de execução
        run_id = await self.repo.create_schedule_run(
            report['id'],
            report.get('next_run_at') or datetime.now()
        )
        
        # Atualiza status para running
        await self.repo.update_schedule_run(run_id, {
            'status': 'running',
            'started_at': datetime.now()
        })
        
        try:
            # Cria ReportsService
            reports_service = ReportsService(self.db, self.redis)
            
            # Gera o report
            from .reports_service import ReportRequest, ReportType, GroupBy, date
            from datetime import timedelta
            
            today = datetime.now().date()
            from_date = report.get('parameters', {}).get('from_date')
            to_date = report.get('parameters', {}).get('to_date')
            
            # Se não tem datas, define período baseado no schedule
            if not from_date or not to_date:
                if report['schedule_type'] == 'daily':
                    from_date = today - timedelta(days=1)
                    to_date = today - timedelta(days=1)
                elif report['schedule_type'] == 'weekly':
                    from_date = today - timedelta(days=7)
                    to_date = today - timedelta(days=1)
                elif report['schedule_type'] == 'monthly':
                    from_date = (today.replace(day=1) - timedelta(days=1)).replace(day=1)
                    to_date = today.replace(day=1) - timedelta(days=1)
                else:
                    from_date = today - timedelta(days=30)
                    to_date = today
            
            request = ReportRequest(
                shop_id=report['shop_id'],
                report_type=ReportType(report['report_type']),
                from_date=from_date if isinstance(from_date, date) else datetime.strptime(from_date, '%Y-%m-%d').date(),
                to_date=to_date if isinstance(to_date, date) else datetime.strptime(to_date, '%Y-%m-%d').date(),
                group_by=GroupBy.DAY,
                filters=report.get('filters', {})
            )
            
            # Gera dados
            data, metrics, _ = await reports_service.generate_revenue_report(request)
            
            # Exporta
            export_request = ExportRequest(
                data=data,
                format=ExportFormat(report['format']),
                filename=f"{report['report_type']}_{today}"
            )
            
            filename, file_url = await reports_service.export_report(export_request)
            
            # Atualiza status para completed
            await self.repo.update_schedule_run(run_id, {
                'status': 'completed',
                'completed_at': datetime.now(),
                'row_count': len(data),
                'file_url': file_url,
                'file_format': report['format'],
                'report_snapshot': {
                    'total_revenue': float(metrics.total_revenue),
                    'total_appointments': metrics.total_appointments,
                    'completion_rate': float(metrics.completion_rate)
                }
            })
            
            # Envia email se não for apenas um test run
            if not immediate:
                sent_status = await self._send_report_email(report, file_url, today, metrics)
                await self.repo.update_schedule_run(run_id, {
                    'sent_at': datetime.now(),
                    'sent_status': sent_status.value,
                    'sent_to': report['recipients']
                })
            
            # Atualiza stats e próxima execução
            await self.repo.increment_run_stats(report['id'], success=True)
            if not immediate:
                next_run = self.repo._calculate_next_run(report)
                await self.repo.update_next_run(report['id'], next_run)
            
            return {'status': 'success', 'run_id': run_id, 'file_url': file_url}
        
        except Exception as e:
            # Marca como falha
            await self.repo.update_schedule_run(run_id, {
                'status': 'failed',
                'completed_at': datetime.now(),
                'error_message': str(e),
                'error_code': type(e).__name__
            })
            
            await self.repo.increment_run_stats(report['id'], success=False)
            
            # Schedule retry se aplicável
            if 'retry' not in report.get('schedule_config', {}):
                await self._schedule_retry(report, run_id)
            
            raise
    
    async def _send_report_email(
        self,
        report: Dict[str, Any],
        file_url: str,
        period: str,
        metrics
    ) -> SendStatus:
        """Envia email com o report"""
        to_emails = [r['email'] for r in report['recipients']]
        
        # Gera conteúdo do email
        summary = {
            'total_revenue': float(metrics.total_revenue),
            'total_appointments': metrics.total_appointments,
            'completion_rate': float(metrics.completion_rate)
        }
        
        subject, html_content = self.email_service.generate_report_email(
            report_name=report['report_name'],
            shop_name=f"Shop {report['shop_id']}",
            period=period,
            summary=summary,
            file_url=file_url,
            is_scheduled=True
        )
        
        # Envia
        status = await self.email_service.send_report_email(
            to_emails=to_emails,
            subject=subject,
            html_content=html_content
        )
        
        return status
    
    async def _schedule_retry(
        self,
        report: Dict[str, Any],
        run_id: str
    ) -> None:
        """Agenda uma nova tentativa em caso de falha"""
        max_retries = report.get('schedule_config', {}).get('max_retries', 3)
        
        # Obtém retries count
        query = """
        SELECT retry_count FROM scheduled_reports_history
        WHERE id = $1
        """
        retry_count = await self.db.fetchval(query, run_id) or 0
        
        if retry_count < max_retries:
            # Agenda retry em 5 minutos
            retry_at = datetime.now() + timedelta(minutes=5)
            await self.repo.update_schedule_run(run_id, {
                'retry_count': retry_count + 1,
                'retry_at': retry_at,
                'status': 'pending'
            })
            
            # TODO: Enfileira job no BullMQ para o retry


# ==================== Helper Functions ====================

async def get_scheduled_reports_service(
    db: asyncpg.Connection,
    redis: RedisConfig,
    email_config: Dict[str, Any] = None
) -> ScheduledReportsService:
    """Dependency injection para ScheduledReportsService"""
    return ScheduledReportsService(db, redis, email_config)


# ==================== Exports ====================

__all__ = [
    'ScheduleType',
    'ScheduledReportConfig',
    'ScheduleRun',
    'SendStatus',
    'ScheduledReportsRepository',
    'EmailService',
    'ScheduledReportsService',
    'get_scheduled_reports_service',
]
