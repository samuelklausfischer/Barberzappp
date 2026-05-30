"""
BarberZap - Reports Service

Serviço completo para geração de reports de negócio para barbearias.
Inclui agregação de dados, comparação de períodos, growth rates e exports multi-formato.
"""

import os
import asyncio
import json
import csv
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional, Union, Tuple
from decimal import Decimal
from dataclasses import dataclass, field
from enum import Enum

import asyncpg
import pandas as pd
from fastapi import HTTPException
import xlsxwriter
import tempfile

from ..config.redis_config import RedisConfig
from ..error.exceptions import (
    NotFoundError,
    BadRequestError,
    ValidationError
)

# ==================== Enums ====================

class ReportType(str, Enum):
    """Tipos de reports disponíveis"""
    REVENUE = "revenue"
    APPOINTMENTS = "appointments"
    RETENTION = "retention"
    SERVICE_POPULARITY = "service_popularity"
    EMPLOYEE_PERFORMANCE = "employee_performance"
    NO_SHOW = "no_show"
    PEAK_HOURS = "peak_hours"
    CUSTOM = "custom"

class ExportFormat(str, Enum):
    """Formatos de exportação disponíveis"""
    JSON = "json"
    CSV = "csv"
    EXCEL = "excel"
    PDF = "pdf"

class GroupBy(str, Enum):
    """Opções de agrupamento"""
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    EMPLOYEE = "employee"
    SERVICE = "service"
    CLIENT = "client"

class SortBy(str, Enum):
    """Opções de ordenação"""
    REVENUE = "revenue"
    COUNT = "count"
    NAME = "name"
    DATE = "date"
    COMPLETION_RATE = "completion_rate"

# ==================== Data Classes ====================

@dataclass
class ReportRequest:
    """Parâmetros de requisição de report"""
    shop_id: str
    report_type: ReportType
    from_date: date
    to_date: date
    group_by: GroupBy = GroupBy.DAY
    sort_by: SortBy = SortBy.REVENUE
    compare_to_previous: bool = False
    filters: Dict[str, Any] = field(default_factory=dict)
    limit: int = 1000
    offset: int = 0

@dataclass
class ExportRequest:
    """Parâmetros de exportação de report"""
    data: List[Dict[str, Any]]
    format: ExportFormat
    filename: Optional[str] = None
    include_headers: bool = True
    sheets: Optional[List[str]] = None  # Para Excel multi-sheet

@dataclass
class ReportMetrics:
    """Métricas calculadas de um report"""
    total_revenue: Decimal = Decimal('0')
    total_appointments: int = 0
    avg_ticket_value: Decimal = Decimal('0')
    completion_rate: Decimal = Decimal('0')
    no_show_rate: Decimal = Decimal('0')
    client_count: int = 0
    new_clients: int = 0
    returning_clients: int = 0
    retention_rate: Decimal = Decimal('0')

@dataclass
class ReportComparisons:
    """Comparação com período anterior"""
    previous_revenue: Decimal = Decimal('0')
    previous_appointments: int = 0
    revenue_growth_rate: Decimal = Decimal('0')
    appointments_growth_rate: Decimal = Decimal('0')
    revenue_absolute_change: Decimal = Decimal('0')
    appointments_absolute_change: int = 0

# ==================== Repository ====================

class ReportsRepository:
    """Repository para queries de reports"""
    
    def __init__(self, db: asyncpg.Connection):
        self.db = db
    
    async def get_revenue_report(
        self,
        shop_id: str,
        from_date: date,
        to_date: date,
        compare_to_previous: bool = False,
        group_by: str = 'day'
    ) -> List[Dict[str, Any]]:
        """
        Executa a função SQL get_revenue_report.
        
        Args:
            shop_id: ID da barbearia
            from_date: Data inicial
            to_date: Data final
            compare_to_previous: Comparar com período anterior
            group_by: Agrupamento (day, week, month)
            
        Returns:
            Lista de dados do report
        """
        query = """
        SELECT 
            period,
            group_label,
            appointments_count,
            completed_count,
            cancelled_count,
            no_show_count,
            total_revenue,
            completed_revenue,
            avg_ticket_value,
            completion_rate,
            no_show_rate,
            previous_period_revenue,
            previous_period_appointments,
            revenue_growth_rate,
            appointments_growth_rate
        FROM get_revenue_report($1, $2, $3, $4, $5)
        ORDER BY period ASC
        """
        
        rows = await self.db.fetch(
            query,
            shop_id,
            from_date,
            to_date,
            compare_to_previous,
            group_by
        )
        
        return [self._format_row(row) for row in rows]
    
    async def get_appointments_report(
        self,
        shop_id: str,
        from_date: date,
        to_date: date,
        employee_id: Optional[str] = None,
        service_id: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Executa a função SQL get_appointments_report.
        
        Args:
            shop_id: ID da barbearia
            from_date: Data inicial
            to_date: Data final
            employee_id: Filtro de funcionário
            service_id: Filtro de serviço
            status: Filtro de status
            
        Returns:
            Lista de agendamentos
        """
        query = """
        SELECT * FROM get_appointments_report(
            $1, $2, $3, $4, $5, $6
        )
        ORDER BY scheduled_at DESC
        LIMIT 10000
        """
        
        rows = await self.db.fetch(
            query,
            shop_id,
            from_date,
            to_date,
            employee_id,
            service_id,
            status
        )
        
        return [self._format_row(row) for row in rows]
    
    async def get_client_retention_report(
        self,
        shop_id: str,
        year: int,
        month: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Executa a função SQL get_client_retention_report.
        
        Args:
            shop_id: ID da barbearia
            year: Ano
            month: Mês (opcional)
            
        Returns:
            Lista de dados de retenção
        """
        query = """
        SELECT * FROM get_client_retention_report($1, $2, $3)
        ORDER BY year, month ASC
        """
        
        rows = await self.db.fetch(query, shop_id, year, month)
        return [self._format_row(row) for row in rows]
    
    async def get_service_popularity_report(
        self,
        shop_id: str,
        from_date: date,
        to_date: date,
        sort_by: str = 'revenue'
    ) -> List[Dict[str, Any]]:
        """
        Executa a função SQL get_service_popularity_report.
        
        Args:
            shop_id: ID da barbearia
            from_date: Data inicial
            to_date: Data final
            sort_by: Ordenação (revenue, count, completion_rate)
            
        Returns:
            Lista de serviços com métricas
        """
        query = """
        SELECT * FROM get_service_popularity_report($1, $2, $3, $4)
        """
        
        rows = await self.db.fetch(query, shop_id, from_date, to_date, sort_by)
        return [self._format_row(row) for row in rows]
    
    async def get_employee_performance_report(
        self,
        shop_id: str,
        from_date: date,
        to_date: date,
        include_inactive: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Executa a função SQL get_employee_performance_report.
        
        Args:
            shop_id: ID da barbearia
            from_date: Data inicial
            to_date: Data final
            include_inactive: Incluir funcionários inativos
            
        Returns:
            Lista de performance dos funcionários
        """
        query = """
        SELECT * FROM get_employee_performance_report($1, $2, $3, $4)
        """
        
        rows = await self.db.fetch(query, shop_id, from_date, to_date, include_inactive)
        return [self._format_row(row) for row in rows]
    
    async def get_no_show_report(
        self,
        shop_id: str,
        from_date: date,
        to_date: date,
        group_by: str = 'day'
    ) -> List[Dict[str, Any]]:
        """
        Executa a função SQL get_no_show_report.
        
        Args:
            shop_id: ID da barbearia
            from_date: Data inicial
            to_date: Data final
            group_by: Agrupamento (day, week, employee, service)
            
        Returns:
            Lista de dados de no-show
        """
        query = """
        SELECT * FROM get_no_show_report($1, $2, $3, $4)
        """
        
        rows = await self.db.fetch(query, shop_id, from_date, to_date, group_by)
        return [self._format_row(row) for row in rows]
    
    async def get_peak_hours_report(
        self,
        shop_id: str,
        from_date: date,
        to_date: date
    ) -> List[Dict[str, Any]]:
        """
        Executa a função SQL get_peak_hours_report.
        
        Args:
            shop_id: ID da barbearia
            from_date: Data inicial
            to_date: Data final
            
        Returns:
            Lista de horários de pico
        """
        query = """
        SELECT * FROM get_peak_hours_report($1, $2, $3)
        """
        
        rows = await self.db.fetch(query, shop_id, from_date, to_date)
        return [self._format_row(row) for row in rows]
    
    async def get_custom_report_metrics(
        self,
        shop_id: str,
        from_date: date,
        to_date: date,
        metrics: List[str],
        filters: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Executa a função SQL get_custom_report_metrics.
        
        Args:
            shop_id: ID da barbearia
            from_date: Data inicial
            to_date: Data final
            metrics: Lista de métricas a retornar
            filters: Filtros adicionais (como JSONB)
            
        Returns:
            Lista de métricas calculadas
        """
        query = """
        SELECT * FROM get_custom_report_metrics(
            $1, $2, $3, $4, $5
        )
        """
        
        rows = await self.db.fetch(
            query,
            shop_id,
            from_date,
            to_date,
            metrics,
            json.dumps(filters) if filters else '{}'
        )
        
        return [self._format_row(row) for row in rows]
    
    async def log_report_run(
        self,
        shop_id: str,
        report_type: str,
        report_name: str,
        from_date: date,
        to_date: date,
        parameters: Dict[str, Any],
        user_id: str,
        user_name: str,
        user_email: str
    ) -> str:
        """
        Registra início de execução de report.
        
        Returns:
            ID do log de execução
        """
        query = """
        SELECT log_report_run(
            $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
        """
        
        run_id = await self.db.fetchval(
            query,
            shop_id,
            report_type,
            report_name,
            from_date,
            to_date,
            json.dumps(parameters),
            user_id,
            user_name,
            user_email
        )
        
        return str(run_id)
    
    async def complete_report_run(
        self,
        run_id: str,
        row_count: int,
        file_url: str = None,
        file_format: str = None,
        file_size_bytes: int = None
    ) -> None:
        """Finaliza execução de report com sucesso"""
        query = "SELECT complete_report_run($1, $2, $3, $4, $5)"
        await self.db.execute(query, run_id, row_count, file_url, file_format, file_size_bytes)
    
    async def fail_report_run(
        self,
        run_id: str,
        error_message: str,
        error_code: str = None,
        error_details: Dict = None
    ) -> None:
        """Finaliza execução de report com erro"""
        query = "SELECT fail_report_run($1, $2, $3, $4)"
        await self.db.execute(
            query,
            run_id,
            error_message,
            error_code,
            json.dumps(error_details) if error_details else None
        )
    
    def _format_row(self, row: asyncpg.Record) -> Dict[str, Any]:
        """Formata linha do result set para dicionário"""
        return dict(row)


# ==================== Service ====================

class ReportsService:
    """Service para lógica de negócios de reports"""
    
    def __init__(self, db: asyncpg.Connection, redis: RedisConfig):
        self.db = db
        self.redis = redis
        self.repo = ReportsRepository(db)
    
    async def generate_revenue_report(
        self,
        request: ReportRequest
    ) -> Tuple[List[Dict[str, Any]], ReportMetrics, ReportComparisons]:
        """
        Gera report de receita com métricas e comparações.
        
        Args:
            request: Parâmetros do report
            
        Returns:
            Tuple com (dados do report, métricas, comparações)
        """
        # Obtém dados do report
        data = await self.repo.get_revenue_report(
            request.shop_id,
            request.from_date,
            request.to_date,
            request.compare_to_previous,
            request.group_by.value
        )
        
        # Calcula métricas agregadas
        metrics = self._calculate_revenue_metrics(data)
        
        # Calcula comparações se solicitado
        comparisons = ReportComparisons()
        if request.compare_to_previous and data:
            comparisons = self._calculate_revenue_comparisons(data)
        
        return data, metrics, comparisons
    
    async def generate_appointments_report(
        self,
        request: ReportRequest
    ) -> Tuple[List[Dict[str, Any]], ReportMetrics]:
        """
        Gera report de agendamentos.
        
        Args:
            request: Parâmetros do report
            
        Returns:
            Tuple com (dados do report, métricas)
        """
        employee_id = request.filters.get('employee_id')
        service_id = request.filters.get('service_id')
        status = request.filters.get('status')
        
        data = await self.repo.get_appointments_report(
            request.shop_id,
            request.from_date,
            request.to_date,
            employee_id,
            service_id,
            status
        )
        
        metrics = self._calculate_appointments_metrics(data)
        
        return data, metrics
    
    async def generate_client_retention_report(
        self,
        request: ReportRequest
    ) -> Tuple[List[Dict[str, Any]], ReportMetrics]:
        """
        Gera report de retenção de clientes.
        
        Args:
            request: Parâmetros do report
            
        Returns:
            Tuple com (dados do report, métricas)
        """
        year = request.filters.get('year', request.from_date.year)
        month = request.filters.get('month')
        
        data = await self.repo.get_client_retention_report(
            request.shop_id,
            year,
            month
        )
        
        metrics = self._calculate_retention_metrics(data)
        
        return data, metrics
    
    async def generate_service_popularity_report(
        self,
        request: ReportRequest
    ) -> Tuple[List[Dict[str, Any]], ReportMetrics]:
        """
        Gera report de popularidade de serviços.
        
        Args:
            request: Parâmetros do report
            
        Returns:
            Tuple com (dados do report, métricas)
        """
        data = await self.repo.get_service_popularity_report(
            request.shop_id,
            request.from_date,
            request.to_date,
            request.sort_by.value
        )
        
        metrics = self._calculate_service_metrics(data)
        
        return data, metrics
    
    async def generate_employee_performance_report(
        self,
        request: ReportRequest
    ) -> Tuple[List[Dict[str, Any]], ReportMetrics]:
        """
        Gera report de performance de funcionários.
        
        Args:
            request: Parâmetros do report
            
        Returns:
            Tuple com (dados do report, métricas)
        """
        include_inactive = request.filters.get('include_inactive', False)
        
        data = await self.repo.get_employee_performance_report(
            request.shop_id,
            request.from_date,
            request.to_date,
            include_inactive
        )
        
        metrics = self._calculate_employee_metrics(data)
        
        return data, metrics
    
    async def generate_no_show_report(
        self,
        request: ReportRequest
    ) -> Tuple[List[Dict[str, Any]], ReportMetrics]:
        """
        Gera report de no-show.
        
        Args:
            request: Parâmetros do report
            
        Returns:
            Tuple com (dados do report, métricas)
        """
        data = await self.repo.get_no_show_report(
            request.shop_id,
            request.from_date,
            request.to_date,
            request.group_by.value
        )
        
        metrics = self._calculate_no_show_metrics(data)
        
        return data, metrics
    
    async def generate_peak_hours_report(
        self,
        request: ReportRequest
    ) -> Tuple[List[Dict[str, Any]], ReportMetrics]:
        """
        Gera report de horários de pico.
        
        Args:
            request: Parâmetros do report
            
        Returns:
            Tuple com (dados do report, métricas)
        """
        data = await self.repo.get_peak_hours_report(
            request.shop_id,
            request.from_date,
            request.to_date
        )
        
        metrics = self._calculate_peak_hours_metrics(data)
        
        return data, metrics
    
    async def generate_custom_report(
        self,
        request: ReportRequest
    ) -> List[Dict[str, Any]]:
        """
        Gera report customizado com métricas específicas.
        
        Args:
            request: Parâmetros do report
            
        Returns:
            Lista de métricas calculadas
        """
        metrics = request.filters.get('metrics', [])
        filters = request.filters.get('filters', {})
        
        data = await self.repo.get_custom_report_metrics(
            request.shop_id,
            request.from_date,
            request.to_date,
            metrics,
            filters
        )
        
        return data
    
    async def export_report(
        self,
        export_request: ExportRequest
    ) -> Tuple[str, str]:
        """
        Exporta report para o formato especificado.
        
        Args:
            export_request: Parâmetros de exportação
            
        Returns:
            Tuple com (filename, file_url)
        """
        format_map = {
            ExportFormat.JSON: self._export_to_json,
            ExportFormat.CSV: self._export_to_csv,
            ExportFormat.EXCEL: self._export_to_excel,
        }
        
        if export_request.format not in format_map:
            raise BadRequestError(f"Unsupported export format: {export_request.format}")
        
        # Gera filename com timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        if not export_request.filename:
            export_request.filename = f"report_{timestamp}"
        
        # Escolhe função de exportação
        export_func = format_map[export_request.format]
        
        try:
            file_path, content_type = await export_func(export_request)
            file_size = os.path.getsize(file_path)
            
            # TODO: Upload para storage (S3, GCS, etc)
            # file_url = await storage_service.upload(file_path, content_type)
            file_url = f"/tmp/{export_request.filename}.{export_request.format.value}"
            
            return export_request.filename, file_url
        
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to export report: {str(e)}"
            )
    
    # ==================== Export Functions ====================
    
    async def _export_to_json(
        self,
        request: ExportRequest
    ) -> Tuple[str, str]:
        """Exporta para JSON"""
        file_path = f"/tmp/{request.filename}.json"
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(request.data, f, indent=2, ensure_ascii=False, default=str)
        
        return file_path, 'application/json'
    
    async def _export_to_csv(
        self,
        request: ExportRequest
    ) -> Tuple[str, str]:
        """Exporta para CSV"""
        file_path = f"/tmp/{request.filename}.csv"
        
        if not request.data:
            return file_path, 'text/csv'
        
        with open(file_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(
                f,
                fieldnames=request.data[0].keys(),
                extrasaction='ignore'
            )
            
            if request.include_headers:
                writer.writeheader()
            
            for row in request.data:
                # Converte valores complexos para string
                cleaned_row = {
                    k: (self._format_for_csv(v) if v is not None else '')
                    for k, v in row.items()
                }
                writer.writerow(cleaned_row)
        
        return file_path, 'text/csv'
    
    async def _export_to_excel(
        self,
        request: ExportRequest
    ) -> Tuple[str, str]:
        """Exporta para Excel (XLSX)"""
        file_path = f"/tmp/{request.filename}.xlsx"
        
        # Converte para DataFrame
        df = pd.DataFrame(request.data)
        
        with pd.ExcelWriter(file_path, engine='xlsxwriter') as writer:
            df.to_excel(
                writer,
                sheet_name='Report Data',
                index=False,
                header=request.include_headers
            )
            
            # Formatação básica
            workbook = writer.book
            worksheet = writer.sheets['Report Data']
            
            # Ajusta largura das colunas
            for idx, col in enumerate(df.columns):
                max_len = max(
                    df[col].astype(str).map(len).max(),
                    len(str(col))
                ) + 2
                worksheet.set_column(idx, idx, min(max_len, 50))
        
        return file_path, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    
    async def _export_to_pdf(
        self,
        request: ExportRequest
    ) -> Tuple[str, str]:
        """
        Exporta para PDF (usando reportlab ou similar)
        
        Nota: Esta é uma implementação básica. Para produção,
        considere usar bibliotecas como WeasyPrint ou jsreport.
        """
        # TODO: Implementar exportação para PDF
        raise NotImplementedError("PDF export not yet implemented")
    
    def _format_for_csv(self, value: Any) -> str:
        """Formata valor para CSV"""
        if isinstance(value, (list, dict)):
            return json.dumps(value)
        return str(value)
    
    # ==================== Metric Calculation Helpers ====================
    
    def _calculate_revenue_metrics(self, data: List[Dict]) -> ReportMetrics:
        """Calcula métricas de receita"""
        metrics = ReportMetrics()
        
        for row in data:
            metrics.total_revenue += Decimal(str(row.get('total_revenue', 0)))
            metrics.total_appointments += row.get('appointments_count', 0)
            metrics.completed_count += row.get('completed_count', 0)
        
        if metrics.total_appointments > 0:
            metrics.completion_rate = (
                Decimal(metrics.completed_count) / Decimal(metrics.total_appointments) * 100
            )
        
        return metrics
    
    def _calculate_revenue_comparisons(
        self,
        data: List[Dict]
    ) -> ReportComparisons:
        """Calcula comparações de receita"""
        comparisons = ReportComparisons()
        
        current_revenue = sum(Decimal(str(r.get('completed_revenue', 0))) for r in data)
        current_appointments = sum(r.get('completed_count', 0) for r in data)
        
        previous_revenue = sum(
            Decimal(str(r.get('previous_period_revenue', 0))) 
            for r in data if r.get('previous_period_revenue')
        )
        previous_appointments = sum(
            r.get('previous_period_appointments', 0) 
            for r in data if r.get('previous_period_appointments')
        )
        
        comparisons.previous_revenue = previous_revenue
        comparisons.previous_appointments = previous_appointments
        comparisons.revenue_absolute_change = current_revenue - previous_revenue
        comparisons.appointments_absolute_change = current_appointments - previous_appointments
        
        if previous_revenue > 0:
            comparisons.revenue_growth_rate = (
                (current_revenue - previous_revenue) / previous_revenue * 100
            )
        
        if previous_appointments > 0:
            comparisons.appointments_growth_rate = (
                Decimal(current_appointments - previous_appointments) / 
                Decimal(previous_appointments) * 100
            )
        
        return comparisons
    
    def _calculate_appointments_metrics(self, data: List[Dict]) -> ReportMetrics:
        """Calcula métricas de agendamentos"""
        metrics = ReportMetrics()
        metrics.total_appointments = len(data)
        metrics.completed_count = sum(1 for r in data if r.get('status') == 'completed')
        metrics.no_show_count = sum(1 for r in data if r.get('status') == 'no_show')
        metrics.cancelled_count = sum(1 for r in data if r.get('status') == 'cancelled')
        metrics.client_count = len(set(r.get('client_id') for r in data if r.get('client_id')))
        
        if metrics.total_appointments > 0:
            metrics.completion_rate = (
                Decimal(metrics.completed_count) / Decimal(metrics.total_appointments) * 100
            )
            metrics.no_show_rate = (
                Decimal(metrics.no_show_count) / Decimal(metrics.total_appointments) * 100
            )
        
        return metrics
    
    def _calculate_retention_metrics(self, data: List[Dict]) -> ReportMetrics:
        """Calcula métricas de retenção"""
        metrics = ReportMetrics()
        
        for row in data:
            metrics.client_count += row.get('total_clients', 0)
            metrics.new_clients += row.get('new_clients', 0)
            metrics.returning_clients += row.get('returning_clients', 0)
        
        if metrics.client_count > 0:
            metrics.retention_rate = (
                Decimal(metrics.returning_clients) / Decimal(metrics.client_count) * 100
            )
        
        return metrics
    
    def _calculate_service_metrics(self, data: List[Dict]) -> ReportMetrics:
        """Calcula métricas de serviços"""
        metrics = ReportMetrics()
        
        for row in data:
            metrics.total_revenue += Decimal(str(row.get('completed_revenue', 0)))
            metrics.total_appointments += row.get('completed_count', 0)
        
        if metrics.total_appointments > 0:
            metrics.avg_ticket_value = (
                metrics.total_revenue / Decimal(metrics.total_appointments)
            )
        
        return metrics
    
    def _calculate_employee_metrics(self, data: List[Dict]) -> ReportMetrics:
        """Calcula métricas de funcionários"""
        metrics = ReportMetrics()
        
        for row in data:
            metrics.total_revenue += Decimal(str(row.get('completed_revenue', 0)))
            metrics.completed_count += row.get('completed_count', 0)
            metrics.no_show_count += row.get('no_show_count', 0)
        
        return metrics
    
    def _calculate_no_show_metrics(self, data: List[Dict]) -> ReportMetrics:
        """Calcula métricas de no-show"""
        metrics = ReportMetrics()
        
        for row in data:
            metrics.total_appointments += row.get('total_appointments', 0)
            metrics.no_show_count += row.get('no_show_count', 0)
        
        if metrics.total_appointments > 0:
            metrics.no_show_rate = (
                Decimal(metrics.no_show_count) / Decimal(metrics.total_appointments) * 100
            )
        
        return metrics
    
    def _calculate_peak_hours_metrics(self, data: List[Dict]) -> ReportMetrics:
        """Calcula métricas de horários de pico"""
        metrics = ReportMetrics()
        metrics.total_appointments = sum(r.get('appointment_count', 0) for r in data)
        
        # Identifica horário de pico
        if data:
            peak_hour = max(data, key=lambda x: x.get('appointment_count', 0))
            metrics.peak_hour = peak_hour.get('hour')
        
        return metrics

# ==================== Helper Functions ====================

async def get_db_connection() -> asyncpg.Connection:
    """Obtém conexão com o banco de dados"""
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
    return await asyncpg.connect(db_url)


async def get_reports_service() -> ReportsService:
    """Dependency injection para ReportsService"""
    db = await get_db_connection()
    redis = RedisConfig()
    return ReportsService(db, redis)

# ==================== Exports ====================

__all__ = [
    'ReportType',
    'ReportRequest',
    'ExportRequest',
    'ExportFormat',
    'ReportMetrics',
    'ReportComparisons',
    'ReportsService',
    'ReportsRepository',
    'get_reports_service',
    'get_db_connection',
]
