"""
BarberZap - Reports API

API endpoints para geração e exportação de reports de negócio.
FastAPI router com autenticação, validação e documentação OpenAPI.
"""

import os
import asyncio
from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional
from enum import Enum

import asyncpg
from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
    Query,
    BackgroundTasks,
    UploadFile,
    File
)
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, validator

from .reports_service import (
    ReportsService,
    ReportType,
    ReportRequest,
    ExportRequest,
    ExportFormat,
    ReportMetrics,
    ReportComparisons,
    get_db_connection,
    get_reports_service
)
from .scheduled_reports import (
    ScheduledReportsService,
    ScheduleType,
    ScheduledReportConfig,
    SendStatus,
    get_scheduled_reports_service
)
from ..config.redis_config import RedisConfig
from ..error.exceptions import (
    NotFoundError,
    BadRequestError,
    ValidationError
)

# ==================== Router ====================

router = APIRouter(prefix="/api/reports", tags=["reports"])

# ==================== Pydantic Models ====================

class RevenueReportParams(BaseModel):
    """Parâmetros para report de receita"""
    from_date: date = Field(..., description="Data inicial (YYYY-MM-DD)")
    to_date: date = Field(..., description="Data final (YYYY-MM-DD)")
    group_by: str = Field("day", description="Agrupamento: day, week, month")
    compare_to_previous: bool = Field(False, description="Comparar com período anterior")
    
    @validator('group_by')
    def validate_group_by(cls, v):
        if v not in ['day', 'week', 'month']:
            raise ValueError('group_by must be day, week, or month')
        return v

class AppointmentsReportParams(BaseModel):
    """Parâmetros para report de agendamentos"""
    from_date: date = Field(..., description="Data inicial")
    to_date: date = Field(..., description="Data final")
    employee_id: Optional[str] = Field(None, description="Filtrar por funcionário")
    service_id: Optional[str] = Field(None, description="Filtrar por serviço")
    status: Optional[str] = Field(None, description="Filtrar por status")

class RetentionReportParams(BaseModel):
    """Parâmetros para report de retenção"""
    year: int = Field(..., description="Ano do report")
    month: Optional[int] = Field(None, description="Mês (opcional)")
    
    @validator('month')
    def validate_month(cls, v):
        if v is not None and (v < 1 or v > 12):
            raise ValueError('month must be between 1 and 12')
        return v

class ServicePopularityParams(BaseModel):
    """Parâmetros para report de popularidade de serviços"""
    from_date: date = Field(..., description="Data inicial")
    to_date: date = Field(..., description="Data final")
    sort_by: str = Field("revenue", description="Ordenação: revenue, count, completion_rate")
    
    @validator('sort_by')
    def validate_sort_by(cls, v):
        if v not in ['revenue', 'count', 'completion_rate']:
            raise ValueError('sort_by must be revenue, count, or completion_rate')
        return v

class EmployeePerformanceParams(BaseModel):
    """Parâmetros para report de performance de funcionários"""
    from_date: date = Field(..., description="Data inicial")
    to_date: date = Field(..., description="Data final")
    include_inactive: bool = Field(False, description="Incluir funcionários inativos")

class NoShowReportParams(BaseModel):
    """Parâmetros para report de no-show"""
    from_date: date = Field(..., description="Data inicial")
    to_date: date = Field(..., description="Data final")
    group_by: str = Field("day", description="Agrupamento: day, week, employee, service")
    
    @validator('group_by')
    def validate_group_by(cls, v):
        if v not in ['day', 'week', 'employee', 'service']:
            raise ValueError('group_by must be day, week, employee, or service')
        return v

class CustomMetricsParams(BaseModel):
    """Parâmetros para métricas customizadas"""
    from_date: date = Field(..., description="Data inicial")
    to_date: date = Field(..., description="Data final")
    metrics: List[str] = Field(..., description="Lista de métricas")
    filters: Dict[str, Any] = Field(default_factory=dict, description="Filtros adicionais")

class ExportParams(BaseModel):
    """Parâmetros para exportação de report"""
    format: str = Field(..., description="Formato: json, csv, excel, pdf")
    filename: Optional[str] = Field(None, description="Nome do arquivo")
    include_headers: bool = Field(True, description="Incluir cabeçalhos")

class ScheduledReportCreate(BaseModel):
    """Dados para criar report agendado"""
    report_name: str = Field(..., description="Nome do report")
    report_type: str = Field(..., description="Tipo de report")
    schedule_type: ScheduleType = Field(..., description="Tipo de schedule")
    schedule_cron: Optional[str] = Field(None, description="Expressão cron customizada")
    parameters: Dict[str, Any] = Field(default_factory=dict)
    filters: Dict[str, Any] = Field(default_factory=dict)
    recipients: List[Dict[str, str]] = Field(..., description="Destinatários")
    subject_template: Optional[str] = Field(None, description="Template do assunto")
    message_template: Optional[str] = Field(None, description="Template da mensagem")
    format: ExportFormat = Field(ExportFormat.PDF, description="Formato do arquivo")
    include_charts: bool = Field(True, description="Incluir gráficos")
    include_summary: bool = Field(True, description="Incluir resumo")

class ScheduledReportUpdate(BaseModel):
    """Dados para atualizar report agendado"""
    report_name: Optional[str] = None
    schedule_type: Optional[ScheduleType] = None
    schedule_cron: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    filters: Optional[Dict[str, Any]] = None
    recipients: Optional[List[Dict[str, str]]] = None
    is_active: Optional[bool] = None
    format: Optional[ExportFormat] = None

class ExportResponse(BaseModel):
    """Resposta de exportação"""
    filename: str
    file_url: str
    format: ExportFormat
    size_bytes: Optional[int]

class ReportResponse(BaseModel):
    """Resposta padrão de report"""
    data: List[Dict[str, Any]]
    metrics: ReportMetrics
    comparisons: Optional[ReportComparisons] = None
    generated_at: datetime

class ScheduledReportResponse(BaseModel):
    """Resposta de report agendado"""
    id: str
    shop_id: str
    report_name: str
    report_type: str
    schedule_type: str
    is_active: bool
    next_run_at: Optional[datetime]
    last_run_at: Optional[datetime]
    run_count: int
    created_at: datetime

class ScheduleRunResponse(BaseModel):
    """Resposta de execução de report agendado"""
    id: str
    scheduled_report_id: str
    scheduled_at: datetime
    status: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_ms: Optional[int]
    file_url: Optional[str]
    sent_status: Optional[str]


# ==================== Dependency Injection ====================

async def get_shop_id(
    shop_id: str = Query(..., description="Shop ID")
) -> str:
    """Obtém e valida shop_id"""
    if not shop_id:
        raise BadRequestError("shop_id is required")
    return shop_id


# ==================== Endpoints ====================

@router.get("/revenue")
async def get_revenue_report_endpoint(
    shop_id: str = Depends(get_shop_id),
    params: RevenueReportParams = Depends()
) -> ReportResponse:
    """
    Obtém report de receita.
    
    - **from_date**: Data inicial do período
    - **to_date**: Data final do período  
    - **group_by**: Agrupamento (day, week, month)
    - **compare_to_previous**: Comparar com período anterior
    """
    service = await get_reports_service()
    
    request = ReportRequest(
        shop_id=shop_id,
        report_type=ReportType.REVENUE,
        from_date=params.from_date,
        to_date=params.to_date,
        group_by=params.group_by,
        compare_to_previous=params.compare_to_previous
    )
    
    data, metrics, comparisons = await service.generate_revenue_report(request)
    
    return ReportResponse(
        data=data,
        metrics=metrics,
        comparisons=comparisons if params.compare_to_previous else None,
        generated_at=datetime.now()
    )


@router.get("/appointments")
async def get_appointments_report_endpoint(
    shop_id: str = Depends(get_shop_id),
    params: AppointmentsReportParams = Depends()
) -> ReportResponse:
    """
    Obtém report de agendamentos.
    
    - **from_date**: Data inicial
    - **to_date**: Data final
    - **employee_id**: Filtrar por funcionário (opcional)
    - **service_id**: Filtrar por serviço (opcional)
    - **status**: Filtrar por status (opcional)
    """
    service = await get_reports_service()
    
    request = ReportRequest(
        shop_id=shop_id,
        report_type=ReportType.APPOINTMENTS,
        from_date=params.from_date,
        to_date=params.to_date,
        filters={
            'employee_id': params.employee_id,
            'service_id': params.service_id,
            'status': params.status
        }
    )
    
    data, metrics = await service.generate_appointments_report(request)
    
    return ReportResponse(
        data=data,
        metrics=metrics,
        generated_at=datetime.now()
    )


@router.get("/retention")
async def get_retention_report_endpoint(
    shop_id: str = Depends(get_shop_id),
    params: RetentionReportParams = Depends()
) -> ReportResponse:
    """
    Obtém report de retenção de clientes.
    
    - **year**: Ano do report
    - **month**: Mês específico (opcional)
    """
    service = await get_reports_service()
    
    from_date = date(params.year, params.month or 1, 1)
    to_date = date(params.year, params.month or 12, 31 if not params.month else 28)
    
    request = ReportRequest(
        shop_id=shop_id,
        report_type=ReportType.RETENTION,
        from_date=from_date,
        to_date=to_date,
        filters={
            'year': params.year,
            'month': params.month
        }
    )
    
    data, metrics = await service.generate_client_retention_report(request)
    
    return ReportResponse(
        data=data,
        metrics=metrics,
        generated_at=datetime.now()
    )


@router.get("/service-popularity")
async def get_service_popularity_report_endpoint(
    shop_id: str = Depends(get_shop_id),
    params: ServicePopularityParams = Depends()
) -> ReportResponse:
    """
    Obtém report de popularidade de serviços.
    
    - **from_date**: Data inicial
    - **to_date**: Data final
    - **sort_by**: Ordenação (revenue, count, completion_rate)
    """
    service = await get_reports_service()
    
    request = ReportRequest(
        shop_id=shop_id,
        report_type=ReportType.SERVICE_POPULARITY,
        from_date=params.from_date,
        to_date=params.to_date,
        sort_by=params.sort_by
    )
    
    data, metrics = await service.generate_service_popularity_report(request)
    
    return ReportResponse(
        data=data,
        metrics=metrics,
        generated_at=datetime.now()
    )


@router.get("/employee-performance")
async def get_employee_performance_report_endpoint(
    shop_id: str = Depends(get_shop_id),
    params: EmployeePerformanceParams = Depends()
) -> ReportResponse:
    """
    Obtém report de performance de funcionários.
    
    - **from_date**: Data inicial
    - **to_date**: Data final
    - **include_inactive**: Incluir funcionários inativos
    """
    service = await get_reports_service()
    
    request = ReportRequest(
        shop_id=shop_id,
        report_type=ReportType.EMPLOYEE_PERFORMANCE,
        from_date=params.from_date,
        to_date=params.to_date,
        filters={
            'include_inactive': params.include_inactive
        }
    )
    
    data, metrics = await service.generate_employee_performance_report(request)
    
    return ReportResponse(
        data=data,
        metrics=metrics,
        generated_at=datetime.now()
    )


@router.get("/no-show")
async def get_no_show_report_endpoint(
    shop_id: str = Depends(get_shop_id),
    params: NoShowReportParams = Depends()
) -> ReportResponse:
    """
    Obtém report de no-show.
    
    - **from_date**: Data inicial
    - **to_date**: Data final
    - **group_by**: Agrupamento (day, week, employee, service)
    """
    service = await get_reports_service()
    
    request = ReportRequest(
        shop_id=shop_id,
        report_type=ReportType.NO_SHOW,
        from_date=params.from_date,
        to_date=params.to_date,
        group_by=params.group_by
    )
    
    data, metrics = await service.generate_no_show_report(request)
    
    return ReportResponse(
        data=data,
        metrics=metrics,
        generated_at=datetime.now()
    )


@router.get("/peak-hours")
async def get_peak_hours_report_endpoint(
    shop_id: str = Depends(get_shop_id),
    from_date: date = Query(..., description="Data inicial"),
    to_date: date = Query(..., description="Data final")
) -> ReportResponse:
    """
    Obtém report de horários de pico.
    
    - **from_date**: Data inicial
    - **to_date**: Data final
    """
    service = await get_reports_service()
    
    request = ReportRequest(
        shop_id=shop_id,
        report_type=ReportType.PEAK_HOURS,
        from_date=from_date,
        to_date=to_date
    )
    
    data, metrics = await service.generate_peak_hours_report(request)
    
    return ReportResponse(
        data=data,
        metrics=metrics,
        generated_at=datetime.now()
    )


@router.get("/metrics")
async def get_custom_metrics_endpoint(
    shop_id: str = Depends(get_shop_id),
    params: CustomMetricsParams = Depends()
) -> List[Dict[str, Any]]:
    """
    Obtém métricas customizadas.
    
    - **from_date**: Data inicial
    - **to_date**: Data final
    - **metrics**: Lista de métricas (ex: ["total_revenue", "total_appointments", "avg_ticket_value"])
    - **filters**: Filtros adicionais (JSON)
    
    Métricas disponíveis:
    - total_revenue
    - total_appointments  
    - avg_ticket_value
    - no_show_rate
    - completion_rate
    - total_clients
    - new_clients
    """
    service = await get_reports_service()
    
    request = ReportRequest(
        shop_id=shop_id,
        report_type=ReportType.CUSTOM,
        from_date=params.from_date,
        to_date=params.to_date,
        filters={
            'metrics': params.metrics,
            'filters': params.filters
        }
    )
    
    data = await service.generate_custom_report(request)
    
    return data


@router.post("/export")
async def export_report_endpoint(
    shop_id: str = Depends(get_shop_id),
    data: List[Dict[str, Any]] = Body(..., description="Dados do report para exportar"),
    params: ExportParams = Depends()
) -> ExportResponse:
    """
    Exporta report para o formato especificado.
    
    - **format**: Formato (json, csv, excel, pdf)
    - **filename**: Nome do arquivo (opcional)
    - **include_headers**: Incluir cabeçalhos em CSV/Excel
    
    Retorna URL do arquivo gerado.
    """
    service = await get_reports_service()
    
    try:
        export_format = ExportFormat(params.format)
    except ValueError:
        raise BadRequestError(f"Invalid format: {params.format}")
    
    export_request = ExportRequest(
        data=data,
        format=export_format,
        filename=params.filename,
        include_headers=params.include_headers
    )
    
    filename, file_url = await service.export_report(export_request)
    
    # Obtem tamanho do arquivo
    file_size = os.path.getsize(file_url) if os.path.exists(file_url) else None
    
    return ExportResponse(
        filename=filename,
        file_url=file_url,
        format=export_format,
        size_bytes=file_size
    )


@router.get("/export/{file_id}")
async def download_report_endpoint(
    file_id: str,
    shop_id: str = Depends(get_shop_id)
) -> FileResponse:
    """
    Baixa um arquivo de report exportado.
    
    - **file_id**: ID do arquivo exportado
    """
    # TODO: Implementar download real do storage
    # Por enquanto, retorna 404
    raise HTTPException(status_code=404, detail="File not found")


# ==================== Scheduled Reports Endpoints ====================

@router.get("/scheduled")
async def list_scheduled_reports_endpoint(
    shop_id: str = Depends(get_shop_id),
    active_only: bool = Query(False, description="Apenas reports ativos")
) -> List[ScheduledReportResponse]:
    """
    Lista todos os reports agendados da barbearia.
    
    - **active_only**: Filtrar apenas reports ativos
    """
    db = await get_db_connection()
    redis = RedisConfig()
    service = ScheduledReportsService(db, redis)
    
    reports = await service.list_scheduled_reports(shop_id, active_only)
    
    return [ScheduledReportResponse(**r) for r in reports]


@router.post("/scheduled")
async def create_scheduled_report_endpoint(
    shop_id: str = Depends(get_shop_id),
    user_id: str = Query(..., description="ID do usuário"),
    data: ScheduledReportCreate = Body(..., description="Configuração do report agendado")
) -> ScheduledReportResponse:
    """
    Cria um novo report agendado.
    
    Exemplo de recipients:
    ```json
    [
      {"email": "owner@example.com", "name": "Owner", "role": "owner"},
      {"email": "manager@example.com", "name": "Manager", "role": "admin"}
    ]
    ```
    """
    db = await get_db_connection()
    redis = RedisConfig()
    service = ScheduledReportsService(db, redis)
    
    config = ScheduledReportConfig(
        shop_id=shop_id,
        report_type=data.report_type,
        report_name=data.report_name,
        schedule_type=data.schedule_type,
        schedule_cron=data.schedule_cron,
        parameters=data.parameters,
        filters=data.filters,
        recipients=data.recipients,
        subject_template=data.subject_template,
        message_template=data.message_template,
        format=data.format,
        include_charts=data.include_charts,
        include_summary=data.include_summary,
        is_active=True
    )
    
    report = await service.create_scheduled_report(shop_id, user_id, config)
    
    return ScheduledReportResponse(**report)


@router.get("/scheduled/{report_id}")
async def get_scheduled_report_endpoint(
    shop_id: str = Depends(get_shop_id),
    report_id: str = Path(..., description="ID do report agendado")
) -> Dict[str, Any]:
    """
    Obtém detalhes de um report agendado incluindo histórico de execuções.
    """
    db = await get_db_connection()
    redis = RedisConfig()
    service = ScheduledReportsService(db, redis)
    
    report = await service.get_scheduled_report(shop_id, report_id)
    
    return report


@router.put("/scheduled/{report_id}")
async def update_scheduled_report_endpoint(
    shop_id: str = Depends(get_shop_id),
    report_id: str = Path(..., description="ID do report agendado"),
    data: ScheduledReportUpdate = Body(..., description="Atualizações")
) -> ScheduledReportResponse:
    """
    Atualiza um report agendado.
    
    Campos que podem ser atualizados:
    - report_name
    - schedule_type
    - schedule_cron
    - parameters
    - filters
    - recipients
    - is_active
    - format
    """
    db = await get_db_connection()
    redis = RedisConfig()
    service = ScheduledReportsService(db, redis)
    
    updates = data.dict(exclude_unset=True)
    report = await service.update_scheduled_report(shop_id, report_id, updates)
    
    return ScheduledReportResponse(**report)


@router.delete("/scheduled/{report_id}")
async def delete_scheduled_report_endpoint(
    shop_id: str = Depends(get_shop_id),
    report_id: str = Path(..., description="ID do report agendado")
) -> dict:
    """
    Remove um report agendado (soft delete).
    """
    db = await get_db_connection()
    redis = RedisConfig()
    service = ScheduledReportsService(db, redis)
    
    await service.delete_scheduled_report(shop_id, report_id)
    
    return {"status": "success", "message": "Scheduled report deleted"}


@router.post("/scheduled/{report_id}/run-now")
async def run_scheduled_report_now_endpoint(
    shop_id: str = Depends(get_shop_id),
    report_id: str = Path(..., description="ID do report agendado"),
    background_tasks: BackgroundTasks = BackgroundTasks()
) -> Dict[str, Any]:
    """
    Executa um report agendado imediatamente (test run).
    
    Útil para testar configurações antes de agendar.
    """
    db = await get_db_connection()
    redis = RedisConfig()
    service = ScheduledReportsService(db, redis)
    
    # Executa em background
    def run_task():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(service.run_now(shop_id, report_id))
            return result
        finally:
            loop.close()
    
    background_tasks.add_task(run_task)
    
    return {
        "status": "started",
        "message": "Report execution started in background"
    }


@router.get("/scheduled/{report_id}/history")
async def get_scheduled_report_history_endpoint(
    shop_id: str = Depends(get_shop_id),
    report_id: str = Path(..., description="ID do report agendado"),
    limit: int = Query(50, description="Quantidade de registros")
) -> List[ScheduleRunResponse]:
    """
    Obtém histórico de execuções de um report agendado.
    """
    db = await get_db_connection()
    redis = RedisConfig()
    service = ScheduledReportsService(db, redis)
    
    history = await service.get_schedule_run_history(shop_id, report_id, limit)
    
    return [ScheduleRunResponse(**h) for h in history]


# ==================== Health/Status Endpoints ====================

@router.get("/status")
async def get_reports_status(
    shop_id: str = Depends(get_shop_id)
) -> Dict[str, Any]:
    """
    Obtém status da infraestrutura de reports.
    
    Inclui:
    - Status das views materializadas
    - Quantidade de reports agendados ativos
    - Última atualização dos dados
    """
    db = await get_db_connection()
    
    # Status das views materializadas
    mv_query = """
    SELECT 
        schemaname,
        matviewname,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size,
        (
            SELECT stats.last_refresh_time
            FROM pg_stat_matviews stats
            WHERE stats.relid = (
                SELECT oid FROM pg_class WHERE relname = pg_matviews.matviewname
            )
        ) as last_refresh
    FROM pg_matviews
    WHERE matviewname LIKE 'mv_%report%'
    """
    
    materialized_views = await db.fetch(mv_query)
    
    # Reports agendados
    scheduled_query = """
    SELECT 
        COUNT(*) FILTER (WHERE is_active = TRUE) as active_count,
        COUNT(*) FILTER (WHERE is_active = FALSE) as inactive_count,
        MAX(next_run_at) as next_scheduled_run
    FROM scheduled_reports
    WHERE shop_id = $1
    """
    
    scheduled_stats = await db.fetchrow(scheduled_query, shop_id)
    
    return {
        "shop_id": shop_id,
        "materialized_views": [
            {
                "name": row['matviewname'],
                "size": row['size'],
                "last_refresh": row['last_refresh']
            }
            for row in materialized_views
        ],
        "scheduled_reports": {
            "active_count": int(scheduled_stats['active_count']),
            "inactive_count": int(scheduled_stats['inactive_count']),
            "next_scheduled_run": scheduled_stats['next_scheduled_run']
        },
        "timestamp": datetime.now().isoformat()
    }


# ==================== Bulk Operations ====================

@router.post("/bulk")
async def generate_multiple_reports(
    shop_id: str = Depends(get_shop_id),
    from_date: date = Query(..., description="Data inicial"),
    to_date: date = Query(..., description="Data final"),
    report_types: List[ReportType] = Query(..., description="Tipos de reports a gerar"),
    background_tasks: BackgroundTasks = BackgroundTasks()
) -> Dict[str, Any]:
    """
    Gera múltiplos reports em paralelo e retorna URLs dos arquivos.
    
    Útil para exportação de relatórios mensais/semestrais.
    """
    
    async def generate_report_task(report_type: ReportType):
        db = await get_db_connection()
        redis = RedisConfig()
        service = ReportsService(db, redis)
        
        request = ReportRequest(
            shop_id=shop_id,
            report_type=report_type,
            from_date=from_date,
            to_date=to_date
        )
        
        data, metrics, _ = await service.generate_revenue_report(request)
        
        export_request = ExportRequest(
            data=data,
            format=ExportFormat.EXCEL,
            filename=f"bulk_{report_type.value}_{from_date}_{to_date}"
        )
        
        filename, file_url = await service.export_report(export_request)
        
        return {
            "report_type": report_type.value,
            "filename": filename,
            "file_url": file_url
        }
    
    # Executa todas as tasks em paralelo
    tasks = [generate_report_task(rt) for rt in report_types]
    results = await asyncio.gather(*tasks)
    
    return {
        "shop_id": shop_id,
        "period": {"from": str(from_date), "to": str(to_date)},
        "reports": results,
        "count": len(results)
    }


# ==================== Exports ====================

__all__ = ['router']
