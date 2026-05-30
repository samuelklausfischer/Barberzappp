# BarberZap - Advanced Reports Feature

Documentação completa do sistema de reports Business Intelligence para BarberZap.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [SQL - Materialized Views](#sql---materialized-views)
- [SQL - Functions](#sql---functions)
- [SQL - Audit Tables](#sql---audit-tables)
- [Python Backend](#python-backend)
- [Frontend Components](#frontend-components)
- [API Endpoints](#api-endpoints)
- [Scheduled Reports](#scheduled-reports)
- [Export Formats](#export-formats)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)

---

## Visão Geral

O sistema de Advanced Reports da BarberZap fornece insights completos de negócio para barbearias, incluindo:

- **Receita**: Análise de faturamento com comparação de períodos
- **Agendamentos**: Detalhamento completo de appointments
- **Retenção**: Métricas de fidelidade de clientes
- **Popularidade de Serviços**: Serviços mais rentáveis
- **Performance de Funcionários**: Desempenho individual
- **No-Show Analysis**: Análise de ausências
- **Horários de Pico**: Identificação de rush hours

### Features Principais

✅ Views materializadas para performance  
✅ Funções SQL complexas com agregação  
✅ Export multi-formato (JSON, CSV, Excel, PDF)  
✅ Gráficos interativos (Recharts)  
✅ Scheduled reports com envio por email  
✅ Custom metrics builder  
✅ Comparação com período anterior  
✅ Growth rate calculations  

---

## Arquitetura

```
BarberZap/
├── database/
│   ├── 16_reports_materialized_views.sql   # Views materializadas
│   ├── 17_reports_functions.sql            # Funções SQL
│   └── 18_reports_audit.sql                # Tabelas de auditoria
├── backend/reports/
│   ├── reports_service.py                 # Service de reports
│   ├── scheduled_reports.py               # Agendamento
│   └── reports_api.py                     # API FastAPI
└── src/components/
    ├── ReportsDashboard.tsx               # Dashboard principal
    ├── ReportChart.tsx                    # Componentes de gráficos
    └── ReportScheduler.tsx                # Interface de agendamento
```

### Fluxo de Dados

```
Appointments → Materialized Views → SQL Functions
     ↓                                        ↓
  Database                               Python Service
     ↓                                        ↓
  API Endpoints  ←  React Components  →  UI
```

---

## Instalação

### Pré-requisitos

- PostgreSQL 14+
- Python 3.9+
- Node.js 18+
- Redis 7+
- pg_cron extension

### Database Setup

1. **Instalar extensões necessárias**:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
```

2. **Executar scripts SQL em ordem**:

```bash
psql -U postgres -d barberzap -f database/16_reports_materialized_views.sql
psql -U postgres -d barberzap -f database/17_reports_functions.sql
psql -U postgres -d barberzap -f database/18_reports_audit.sql
```

### Python Backend

1. **Instalar dependências**:

```bash
cd backend
pip install -r requirements.txt
# Adicionar dependências de reports
pip install asyncpg pandas xlsxwriter croniter aiohttp sendgrid
```

2. **Verificar estrutura**:

```bash
ls -la backend/reports/
# Deve mostrar:
# reports_service.py
# scheduled_reports.py
# reports_api.py
```

3. **Configurar environment variables**:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/barberzap
REDIS_URL=redis://localhost:6379
SENDGRID_API_KEY=your_sendgrid_key
```

### Frontend

1. **Instalar dependências**:

```bash
cd src
npm install recharts lucide-react
```

2. **Verificar componentes**:

```bash
ls -la src/components/
# Deve mostrar:
# ReportsDashboard.tsx
# ReportChart.tsx
# ReportScheduler.tsx
```

---

## Configuração

### PostgreSQL Cron Jobs

O sistema usa `pg_cron` para refresh automático das views materializadas:

```sql
-- Ver jobs ativos
SELECT * FROM cron.job;

-- Desativar um job
SELECT cron.unschedule('daily-reports-refresh');

-- Ver logs
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Refresh Manual

Para refresh manual de todas as views:

```sql
SELECT refresh_all_reports_mv();
```

Para refresh de view específica:

```sql
SELECT refresh_report_mv('mv_daily_revenue');
```

---

## SQL - Materialized Views

### Views Disponíveis

#### 1. `mv_daily_revenue`
Receita agregada por dia.

**Colunas:**
- `report_date` (date)
- `appointments_count` (bigint)
- `completed_count`, `no_show_count`, `cancelled_count` (bigint)
- `total_revenue`, `completed_revenue` (decimal)
- `shop_id` (uuid)

**Refresh:** A cada hora via `hourly-daily-reports-refresh` job.

#### 2. `mv_monthly_revenue`
Receita agregada por mês.

**Colunas:**
- `year`, `month` (integer)
- `total_revenue`, `avg_ticket_value` (decimal)
- `shop_id` (uuid)

**Refresh:** Diariamente via `daily-reports-refresh` job.

#### 3. `mv_client_retention`
Métricas de retenção.

**Colunas:**
- `year`, `month` (integer)
- `total_clients`, `new_clients`, `returning_clients` (bigint)
- `retention_rate`, `client_growth_rate` (numeric)

#### 4. `mv_service_popularity`
Popularidade de serviços.

**Colunas:**
- `service_id`, `service_name`, `service_price`
- `appointment_count`, `total_revenue`
- `completion_rate`, `no_show_rate`

#### 5. `mv_employee_performance`
Performance de funcionários.

**Colunas:**
- `employee_id`, `employee_name`, `role`
- `total_appointments`, `completed_revenue`
- `completion_rate`, `revenue_per_hour`

#### 6. `mv_revenue_by_hour`
Receita por hora do dia.

**Colunas:**
- `hour` (0-23)
- `total_revenue`, `appointment_count`
- `avg_ticket_value`

#### 7. `mv_no_show_rate`
Taxa de no-show por dia.

**Colunas:**
- `report_date` (date)
- `no_show_rate`, `cancellation_rate`
- `lost_revenue`

#### 8. `mv_peak_times`
Horários de pico.

**Colunas:**
- `day_of_week` (0-6)
- `hour` (0-23)
- `appointment_count`, `revenue`
- `is_peak_time`, `is_off_peak`

---

## SQL - Functions

### Funções Disponíveis

#### `get_revenue_report()`

```sql
SELECT * FROM get_revenue_report(
    '<shop_id>'::UUID,
    '2024-01-01'::DATE,
    '2024-01-31'::DATE,
    TRUE,              -- compare_to_previous
    'day'              -- group_by: day|week|month
);
```

**Retorna:** Revenue com comparação com período anterior.

#### `get_appointments_report()`

```sql
SELECT * FROM get_appointments_report(
    '<shop_id>'::UUID,
    '2024-01-01'::DATE,
    '2024-01-31'::DATE,
    NULL,              -- employee_id (opcional)
    NULL,              -- service_id (opcional)
    'completed'         -- status (opcional)
);
```

**Retorna:** Lista detalhada de agendamentos.

#### `get_client_retention_report()`

```sql
SELECT * FROM get_client_retention_report(
    '<shop_id>'::UUID,
    2024,              -- year
    NULL               -- month (opcional)
);
```

**Retorna:** Métricas de retenção por período.

#### `get_service_popularity_report()`

```sql
SELECT * FROM get_service_popularity_report(
    '<shop_id>'::UUID,
    '2024-01-01'::DATE,
    '2024-01-31'::DATE,
    'revenue'          -- sort_by: revenue|count|completion_rate
);
```

**Retorna:** Serviços ordenados por popularidade/receita.

#### `get_employee_performance_report()`

```sql
SELECT * FROM get_employee_performance_report(
    '<shop_id>'::UUID,
    '2024-01-01'::DATE,
    '2024-01-31'::DATE,
    FALSE              -- include_inactive
);
```

**Retorna:** Performance de funcionários com ranking.

#### `get_no_show_report()`

```sql
SELECT * FROM get_no_show_report(
    '<shop_id>'::UUID,
    '2024-01-01'::DATE,
    '2024-01-31'::DATE,
    'day'              -- group_by: day|week|employee|service
);
```

**Retorna:** Análise detalhada de no-show.

#### `get_peak_hours_report()`

```sql
SELECT * FROM get_peak_hours_report(
    '<shop_id>'::UUID,
    '2024-01-01'::DATE,
    '2024-01-31'::DATE
);
```

**Retorna:** Horários de pico com identificação de rush hours.

#### `get_custom_report_metrics()`

```sql
SELECT * FROM get_custom_report_metrics(
    '<shop_id>'::UUID,
    '2024-01-01'::DATE,
    '2024-01-31'::DATE,
    ARRAY['total_revenue', 'total_appointments', 'avg_ticket_value']
);
```

**Retorna:** Métricas customizadas.

---

## SQL - Audit Tables

### Tabelas de Auditoria

#### `report_runs_log`
Log de todas as execuções de reports (manuais).

```sql
-- Buscar execuções recentes
SELECT 
    report_type,
    status,
    started_at,
    duration_ms,
    row_count
FROM report_runs_log
WHERE shop_id = '<shop_id>'
ORDER BY started_at DESC
LIMIT 100;
```

#### `scheduled_reports`
Configurações de reports agendados.

```sql
-- Listar schedules ativos
SELECT 
    report_name,
    schedule_type,
    next_run_at,
    run_count,
    success_count
FROM scheduled_reports
WHERE shop_id = '<shop_id>'
  AND is_active = TRUE;
```

#### `scheduled_reports_history`
Histórico de execuções de reports agendados.

```sql
-- Buscar histórico
SELECT 
    srh.status,
    srh.scheduled_at,
    srh.sent_status,
    sr.error_message
FROM scheduled_reports_history srh
WHERE srh.shop_id = '<shop_id>'
ORDER BY srh.scheduled_at DESC
LIMIT 50;
```

#### `report_templates`
Templates customizados de reports.

#### `report_exports`
Registro de exports/downloads.

#### `report_access_log`
Log completo de acessos e downloads.

#### `report_metrics_cache`
Cache de métricas calculadas.

```sql
-- Limpar cache expirado
SELECT clean_expired_metrics_cache();

-- Invalidar cache de uma shop
SELECT invalidate_metrics_cache('<shop_id>');
```

---

## Python Backend

### reports_service.py

**Exports principais:**

```python
from backend.reports.reports_service import (
    ReportsService,
    ReportType,
    ReportRequest,
    ExportRequest,
    ExportFormat,
    get_reports_service
)
```

**Uso básico:**

```python
from datetime import date

service = await get_reports_service()

request = ReportRequest(
    shop_id=shop_id,
    report_type=ReportType.REVENUE,
    from_date=date(2024, 1, 1),
    to_date=date(2024, 1, 31),
    compare_to_previous=True
)

data, metrics, comparisons = await service.generate_revenue_report(request)
```

### scheduled_reports.py

**Exports principais:**

```python
from backend.reports.scheduled_reports import (
    ScheduledReportsService,
    ScheduleType,
    ScheduledReportConfig,
    get_scheduled_reports_service
)
```

**Criar schedule:**

```python
config = ScheduledReportConfig(
    shop_id=shop_id,
    report_type='revenue',
    report_name='Resumo Diário',
    schedule_type=ScheduleType.DAILY,
    recipients=[{'email': 'owner@barber.com'}],
    format=ExportFormat.PDF
)

report = await service.create_scheduled_report(shop_id, user_id, config)
```

### reports_api.py

Router FastAPI com todos os endpoints de reports.

**Registrar no app:**

```python
from backend.reports.reports_api import router as reports_router

app.include_router(reports_router)
```

---

## Frontend Components

### ReportsDashboard.tsx

Dashboard principal com:

- Seleção de templates de report
- Date range picker
- Filtros avançados
- Preview em table/charts
- Botões de download
- Comparação com período anterior
- Agendamento de reports

**Uso:**

```tsx
import { ReportsDashboard } from '@/components/ReportsDashboard';

<ReportsDashboard shopId={shopId} />
```

### ReportChart.tsx

Componentes de gráficos reutilizáveis:

- `RevenueLineChart` - Receita ao longo do tempo
- `AppointmentsBarChart` - Agendamentos por período
- `ServicePieChart` - Distribuição por serviço
- `DonutChart` - Gráfico de donut
- `EmployeePerformanceChart` - Performance horizontal
- `StackedBarChart` - Empilhado
- `AreaChartComponent` - Tendências
- `HourlyHeatmap` - Heatmap de horários
- `RetentionFunnel` - Funil de retenção

**Uso:**

```tsx
import { ReportChart } from '@/components/ReportChart';

<ReportChart
  type="line"
  data={revenueData}
  dataKey="completed_revenue"
  height={300}
  title="Receita Mensal"
/>
```

### ReportScheduler.tsx

Interface para gerenciamento de schedules:

- Criar/editar/remover schedules
- Configurar recipients
- Test run (executar agora)
- View histórico
- Toggle active/inactive

**Uso:**

```tsx
import { ReportScheduler } from '@/components/ReportScheduler';

<ReportScheduler shopId={shopId} />
```

---

## API Endpoints

### Revenue Report

```
GET /api/reports/revenue
Query params:
  - shop_id (required)
  - from_date (YYYY-MM-DD)
  - to_date (YYYY-MM-DD)
  - group_by (day|week|month)
  - compare_to_previous (boolean)

Response:
{
  data: [...],
  metrics: { totalRevenue, totalAppointments, completionRate, ... },
  comparisons: { revenueGrowthRate, ... },  // se compare_to_previous=true
  generated_at: "2024-01-15T10:00:00Z"
}
```

### Appointments Report

```
GET /api/reports/appointments
Query params:
  - shop_id (required)
  - from_date, to_date
  - employee_id (optional)
  - service_id (optional)
  - status (optional)
```

### Retention Report

```
GET /api/reports/retention
Query params:
  - shop_id (required)
  - year (required)
  - month (optional)
```

### Service Popularity

```
GET /api/reports/service-popularity
Query params:
  - shop_id (required)
  - from_date, to_date
  - sort_by (revenue|count|completion_rate)
```

### Employee Performance

```
GET /api/reports/employee-performance
Query params:
  - shop_id (required)
  - from_date, to_date
  - include_inactive (boolean)
```

### No-Show Report

```
GET /api/reports/no-show
Query params:
  - shop_id (required)
  - from_date, to_date
  - group_by (day|week|employee|service)
```

### Peak Hours

```
GET /api/reports/peak-hours
Query params:
  - shop_id (required)
  - from_date, to_date
```

### Custom Metrics

```
GET /api/reports/metrics
Query params:
  - shop_id (required)
  - from_date, to_date
  - metrics[] (array de metric names)
  - filters (JSON object)

Metrics disponíveis:
  - total_revenue
  - total_appointments
  - avg_ticket_value
  - no_show_rate
  - completion_rate
  - total_clients
  - new_clients
```

### Export

```
POST /api/reports/export
Body:
{
  "data": [...],           // dados do report
  "format": "excel",       // json|csv|excel|pdf
  "filename": "report_1",  // optional
  "include_headers": true
}

Response:
{
  "filename": "report_1",
  "file_url": "/tmp/report_1.xlsx",
  "format": "excel",
  "size_bytes": 12345
}
```

### Scheduled Reports

#### List

```
GET /api/reports/scheduled
Query params:
  - shop_id (required)
  - active_only (boolean)
```

#### Create

```
POST /api/reports/scheduled
Body:
{
  "report_name": "Resumo Diário",
  "report_type": "revenue",
  "schedule_type": "daily",
  "recipients": [{"email": "owner@example.com"}],
  "format": "pdf",
  "include_charts": true,
  "include_summary": true
}
```

#### Update

```
PUT /api/reports/scheduled/{report_id}
Body: (mesmo do create, campos opcionais)
```

#### Delete

```
DELETE /api/reports/scheduled/{report_id}
```

#### Run Now (Test)

```
POST /api/reports/scheduled/{report_id}/run-now
```

#### History

```
GET /api/reports/scheduled/{report_id}/history
Query params:
  - limit (default: 50)
```

### Status

```
GET /api/reports/status
Query params:
  - shop_id (required)

Response:
{
  "materialized_views": [...],
  "scheduled_reports": {
    "active_count": 3,
    "next_scheduled_run": "2024-01-16T02:00:00Z"
  }
}
```

---

## Scheduled Reports

### Configuração

Os scheduled reports funcionam assim:

1. **Configuration**: Define o report, frequência e recipients
2. **Scheduling**: Sistema identifica quando executar (baseado em cron/type)
3. **Execution**: Gera o report automaticamente
4. **Export**: Exporta no formato desejado
5. **Delivery**: Envia por email aos recipients
6. **History**: Registra execução em `scheduled_reports_history`

### Schedule Types

- **Diário**: Executa todo dia às 02:00 (configurável)
- **Semanal**: Sempre no mesmo dia da semana
- **Mensal**: Sempre no mesmo dia do mês
- **Trimestral**: A cada 3 meses
- **Custom**: Expressão cron Unix

### Cron Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └─ Weekday (0-6)
│ │ │ └─── Month (1-12)
│ │ └───── Day (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)
```

Exemplos:
```cron
0 2 * * *          # Diariamente às 02:00
0 9 * * 1-5        # Dias úteis às 09:00
0 9 1 * *          # 1º de cada mês às 09:00
0 0 * * 0          # Domingos à meia-noite
```

---

## Export Formats

### JSON

Formato padrão da API.

```json
[
  {
    "period": "2024-01-01",
    "appointment_count": 25,
    "total_revenue": 1250.00
  }
]
```

### CSV

Formato tabular separado por vírgulas. Inclui headers.

```csv
period,appointment_count,total_revenue
2024-01-01,25,1250.00
2024-01-02,30,1500.00
```

### Excel (XLSX)

Múltiplas sheets suportadas. Formatação de células.

```python
# O suporte a multi-sheet está em development
sheets: ["Summary", "Details", "Charts"]
```

### PDF

**Status:** Em desenvolvimento.

Sugestões de bibliotecas:
- WeasyPrint (HTML→PDF)
- ReportLab (Python puro)
- jsreport (Node.js service)

---

## Performance

### Otimizações Implementadas

1. **Materialized Views**: Queries pré-computadas
2.Índices**: Índices compostos e específicos
3. **Cache**: Redis para métricas frequentes
4. **Pagination**: Limites preventivos em queries
5. **Concurrent Refresh**: `REFRESH MATERIALIZED VIEW CONCURRENTLY`

### Tamanhos Típicos

```
mv_daily_revenue:      ~1-50 MB (depende do volume)
mv_monthly_revenue:    ~10-500 KB
mv_client_retention:   ~100-500 KB
mv_service_popularity: ~10-100 KB
mv_employee_performance: ~10-100 KB
mv_revenue_by_hour:    ~5-50 MB
mv_no_show_rate:       ~1-50 MB
mv_peak_times:         ~10-100 KB
```

### Monitoring

```sql
-- Tamanho das views
SELECT 
    schemaname,
    matviewname,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size
FROM pg_matviews
WHERE matviewname LIKE 'mv_%'
ORDER BY pg_total_relation_size(schemaname||'.'||matviewname) DESC;

-- Tempo de refresh
SELECT * FROM cron.job_run_details
WHERE job_name LIKE '%report%'
ORDER BY start_time DESC
LIMIT 10;

-- Queries lentas
SELECT query, mean_exec_time
FROM pg_stat_statements
WHERE query LIKE '%report%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## Troubleshooting

### Views Not Updating

**Sintoma:** Dados defasados nas views.

**Soluções:**

```sql
-- 1. Ver se cron job está rodando
SELECT * FROM cron.job WHERE job_name LIKE '%report%';

-- 2. Refresh manual
SELECT refresh_all_reports_mv();

-- 3. Ver logs de erro
SELECT * FROM cron.job_run_details 
WHERE status = 'failed'
ORDER BY start_time DESC;
```

### Slow Queries

**Sintoma:** Reports demoram muito para gerar.

**Soluções:**

1. **Ver índices existentes:**
```sql
\d mv_daily_revenue
```

2. **EXPLAIN ANALYZE:**
```sql
EXPLAIN ANALYZE
SELECT * FROM get_revenue_report(
    '<shop_id>'::UUID,
    '2024-01-01'::DATE,
    '2024-01-31'::DATE
);
```

3. **Limitar período:** Use ranges menores

4. **Usar views materializadas:** Elas são mais rápidas que queries ad-hoc

### Memory Issues

**Sintoma:** OOM ao gerar reports grandes.

**Soluções:**

```python
# Use paginação no Python
async def generate_report(report_id: str, offset: int, limit: int):
    query = "SELECT ... LIMIT $1 OFFSET $2"
    return await db.fetch(query, limit, offset)

# Export incrementalmente chunks
for i in range(0, total_rows, 1000):
    chunk = await fetch_chunk(i, 1000)
    write_to_file(chunk)
```

### Email Not Sending

**Sintoma:** Scheduled reports não enviam email.

**Soluções:**

1. **Verificar API key:**
```env
SENDGRID_API_KEY=your_key
```

2. **Ver logs de erro:**
```sql
SELECT error_message, send_error
FROM scheduled_reports_history
WHERE sent_status = 'failed'
ORDER BY scheduled_at DESC;
```

3. **Email Service Mock Mode:**
```python
# Em development, set MOCK_EMAIL=1
# EmailService vai apenas log ao invés de enviar real
```

### Frontend Issues

**Sintoma:** Charts not rendering.

**Soluções:**

```tsx
// 1. Verificar Recharts instalado
npm list recharts

// 2. Ver se data é array
console.log('Chart data:', chartData); // Deve ser [{name, value}, ...]

// 3. Ver ResponsiveContainer
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    {/* children */}
  </LineChart>
</ResponsiveContainer>
```

---

## Testes

### SQL Tests

```sql
-- Testar functions existem
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'get_%_report';

-- Testar views existem
SELECT table_name 
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'mv_%';

-- Testar uma query
SELECT * FROM get_revenue_report(
    (SELECT id FROM shops LIMIT 1),
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE
);
```

### Python Tests

```python
# test_reports.py
import pytest
from backend.reports.reports_service import (
    ReportsService, ReportType, ReportRequest
)

@pytest.mark.asyncio
async def test_revenue_report():
    service = await get_reports_service()
    
    request = ReportRequest(
        shop_id=TEST_SHOP_ID,
        report_type=ReportType.REVENUE,
        from_date=date(2024, 1, 1),
        to_date=date(2024, 1, 31)
    )
    
    data, metrics, comparisons = await service.generate_revenue_report(request)
    
    assert len(data) > 0
    assert metrics.total_revenue > 0
```

### Frontend Tests

```tsx
import { render, screen } from '@testing-library/react';
import { ReportsDashboard } from './ReportsDashboard';

test('renders report templates', () => {
  render(<ReportsDashboard shopId="test-id" />);
  expect(screen.getByText(/receita/i)).toBeInTheDocument();
  expect(screen.getByText(/agendamentos/i)).toBeInTheDocument();
});
```

---

## Roadmap

### Short Term (Q1 2024)

- ✅ Materialized views otimizados
- ✅ SQL functions complexas
- ✅ Export multi-formato
- ✅ Charts interativos
- ✅ Scheduled reports básico
- 🔄 PDF export (in progress)

### Medium Term (Q2 2024)

- 📋 Real-time dashboard updates (WebSocket/SSE)
- 📋 Custom report builder (drag-and-drop)
- 📋 Scheduled reports com multi-recipients
- 📋 Email templates customizáveis
- 📋 Report sharing (public links)

### Long Term (Q3-Q4 2024)

- 📋 AI-powered insights
- 📋 Predictive analytics
- 📋 Benchmarking vs industry
- 📋 Mobile dashboard
- 📋 White-label reports

---

## Suporte

### Documentação Adicional

- PostgreSQL Materialized Views: https://www.postgresql.org/docs/current/sql-creatematerializedview.html
- pg_cron: https://github.com/citusdata/pg_cron
- Recharts: https://recharts.org/
- FastAPI: https://fastapi.tiangolo.com/

### Issues

Reporte bugs ou solicitações de features em:
- GitHub Issues
- Jira Board (Equipe BarberZap)

### Contato

- Engenheiro Backend: backend@barberzap.com
- Engenheiro Frontend: frontend@barberzap.com
- Product Manager: pm@barberzap.com

---

## License

Copyright © 2024 BarberZap. All rights reserved.
