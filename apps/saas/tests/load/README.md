# BarberZap - Load Testing Scripts

Scripts de teste de carga para validar performance do BarberZap usando k6.

## 📋 Índice

- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executar Testes](#executar-testes)
- [Métricas e Relatórios](#métricas-e-relatórios)
- [Cenários](#cenários)
- [Troubleshooting](#troubleshooting)

## 🚀 Pré-requisitos

- **Node.js** (v18 ou superior)
- **k6** (v0.45 ou superior)
- **Aplicação BarberZap rodando** (http://localhost:3000)
- **Redis rodando** (http://localhost:6379)
- **Supabase** configurado (para realtime)

### Instalar k6

```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6

# Ou via download direto
# https://k6.io/docs/getting-started/installation/
```

### Verificar instalação

```bash
k6 version
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
# BarberZap
BASE_URL=http://localhost:3000
API_URL=http://localhost:3000/api

# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key

# WebSocket
WS_URL=ws://localhost:3000/realtime/v1

# Redis
REDIS_URL=http://localhost:6379
REDIS_API_URL=http://localhost:8080  # Se usando redis-http

# Modo de operação
USE_API=true  # true = usar HTTP API, false = Redis direto
DRY_RUN=false  # true = apenas simular, não deletar dados
```

### 2. Configurar Endpoints na Aplicação

Certifique-se que a aplicação BarberZap tenha os seguintes endpoints:

#### Booking API
- `POST /api/auth/login` - Login
- `GET /api/shops/{shopId}/slots` - Horários disponíveis
- `POST /api/appointments` - Criar reserva
- `GET /api/appointments/{id}` - Verificar reserva
- `DELETE /api/appointments/{id}` - Cancelar reserva

#### Dashboard API
- `GET /api/shops/{shopId}/dashboard` - Visão geral
- `GET /api/shops/{shopId}/appointments` - Agendamentos
- `GET /api/shops/{shopId}/clients` - Lista de clientes
- `GET /api/shops/{shopId}/revenue` - Estatísticas de receita

#### Cache API
- `GET /api/cache/{key}` - Buscar valor
- `POST /api/cache` - Definir valor
- `DELETE /api/cache/{key}` - Deletar valor
- `POST /api/cache/invalidate` - Invalidar por padrão

### 3. Configurar Redis HTTP API (Opcional)

Se preferir usar HTTP API para Redis em vez de conexão direta:

```bash
# Usando docker
docker run -p 8080:8080 \
  -e REDIS_URL=redis://localhost:6379 \
  redis/redis-http-server
```

## 🧪 Executar Testes

### Step 1: Setup de Dados de Teste

Antes de rodar os testes, crie os dados necessários:

```bash
k6 run tests/load/setup.js
```

Isso criará:
- 5 usuários shop owners
- 5 barbearias
- Serviços para cada barbearia
- Slots de horários disponíveis
- 100 clientes de teste
- Cache pré-carregado

### Step 2: Rodar Testes Individuais

#### 1. Booking Flow Test

Testa o fluxo completo de reserva com diferentes níveis de concorrência.

**Baseline (1 usuário sequential):**
```bash
k6 run --env BASE_URL=http://localhost:3000 \
  --env SCENARIO=baseline \
  tests/load/load-booking.test.js
```

**Concurrent Users (10 usuários):**
```bash
k6 run --env BASE_URL=http://localhost:3000 \
  --env SCENARIO=concurrent_10 \
  tests/load/load-booking.test.js
```

**Stress Test (até 100 usuários):**
```bash
k6 run --env BASE_URL=http://localhost:3000 \
  --env SCENARIO=stress \
  tests/load/load-booking.test.js
```

#### 2. Dashboard API Test

Testa endpoints do dashboard.

**Baseline:**
```bash
k6 run --env BASE_URL=http://localhost:3000 \
  --env SCENARIO=baseline \
  tests/load/load-dashboard.test.js
```

**Concurrent (25 usuários):**
```bash
k6 run --env BASE_URL=http://localhost:3000 \
  --env SCENARIO=concurrent_25 \
  tests/load/load-dashboard.test.js
```

**Stress:**
```bash
k6 run --env BASE_URL=http://localhost:3000 \
  --env SCENARIO=stress \
  tests/load/load-dashboard.test.js
```

#### 3. Realtime/WebSocket Test

Testa conexões WebSocket e latência de mensagens.

**Baseline:**
```bash
k6 run --env BASE_URL=http://localhost:3000 \
  --env WS_URL=ws://localhost:3000/realtime/v1 \
  --env SUPABASE_URL=your-supabase-url \
  --env SUPABASE_ANON_KEY=your-anon-key \
  --env SCENARIO=baseline \
  tests/load/load-realtime.test.js
```

**Concurrent (20 usuários):**
```bash
k6 run --env BASE_URL=http://localhost:3000 \
  --env SCENARIO=concurrent_20 \
  tests/load/load-realtime.test.js
```

**Stress (até 150 conexões):**
```bash
k6 run --env BASE_URL=http://localhost:3000 \
  --env SCENARIO=stress \
  tests/load/load-realtime.test.js
```

#### 4. Redis Cache Test

Testa operações de cache.

**Baseline:**
```bash
k6 run --env BASE_URL=http://localhost:3000 \
  --env SCENARIO=baseline \
  tests/load/load-redis.test.js
```

**Concurrent (100 usuários):**
```bash
k6 run --env BASE_URL=http://localhost:3000 \
  --env SCENARIO=concurrent_100 \
  tests/load/load-redis.test.js
```

**Stress (até 1000 usuários):**
```bash
k6 run --env BASE_URL=http://localhost:3000 \
  --env SCENARIO=stress \
  tests/load/load-redis.test.js
```

### Step 3: Rodar Todos os Testes

```bash
# Setup
k6 run tests/load/setup.js

# Booking tests
k6 run --env SCENARIO=baseline tests/load/load-booking.test.js
k6 run --env SCENARIO=concurrent_10 tests/load/load-booking.test.js
k6 run --env SCENARIO=stress tests/load/load-booking.test.js

# Dashboard tests
k6 run --env SCENARIO=baseline tests/load/load-dashboard.test.js
k6 run --env SCENARIO=concurrent_25 tests/load/load-dashboard.test.js
k6 run --env SCENARIO=stress tests/load/load-dashboard.test.js

# Realtime tests
k6 run --env SCENARIO=baseline tests/load/load-realtime.test.js
k6 run --env SCENARIO=concurrent_20 tests/load/load-realtime.test.js

# Cache tests
k6 run --env SCENARIO=baseline tests/load/load-redis.test.js
k6 run --env SCENARIO=concurrent_100 tests/load/load-redis.test.js

# Cleanup
k6 run --env DRY_RUN=false tests/load/cleanup.js
```

## 📊 Métricas e Relatórios

### Gerar Relatórios HTML

k6 não gere HTML nativamente, mas você pode usar:

#### Opção 1: k6-reporter (Recomendado)

```bash
# Instalar
npm install -g k6-reporter

# Rodar teste com JSON output
k6 run --env SCENARIO=concurrent_10 tests/load/load-booking.test.js \
  --out json=results.json

# Gerar HTML
k6-reporter results.json -o results.html

# Abrir
open results.html  # macOS
xdg-open results.html  # Linux
start results.html  # Windows
```

#### Opção 2: k6-to-influxdb + Grafana

```bash
# Instalar k6-to-influxdb
go install github.com/grafana/k6-to-influxdb@latest

# Rodar teste
k6 run --out influxdb=http://localhost:8086/k6 tests/load/load-booking.test.js

# Visualizar no Grafana (dashboards disponíveis)
```

#### Opção 3: k6 Cloud (SaaS)

```bash
# Login
k6 cloud login

# Upload e execute
k6 cloud tests/load/load-booking.test.js
```

### Relatório no Console

Durante a execução, k6 mostra estatísticas em tempo real:

```
     ✓ login status is 200
     ✓ login returns access token

     checks.........................: 100.00% ✓ 1234      ✗ 0
     data_received..................: 12 MB  45 KB/s
     data_sent......................: 5.5 MB  20 KB/s
     http_req_blocked...............: avg=12.3µs min=1µs    med=8µs     max=2.5ms    p(90)=15µs   p(95)=18µs
     http_req_connecting............: avg=8.1µs  min=1µs    med=6µs     max=1.2ms    p(90)=10µs   p(95)=12µs
     http_req_duration..............: avg=145ms  min=95ms   med=138ms   max=450ms    p(90)=210ms  p(95)=250ms
       { expected_response:true }...: avg=145ms  min=95ms   med=138ms   max=450ms    p(90)=210ms  p(95)=250ms
```

### Métricas Específicas por Teste

#### Booking Flow
- `booking_errors` - Taxa de erros
- `booking_login_duration` - Latência de login
- `booking_fetch_slots_duration` - Latência de busca de slots
- `booking_book_duration` -.latência de criação de reserva
- `booking_verify_duration` - Latência de verificação
- `booking_successful` - Contador de reservas bem-sucedidas
- `booking_failed` - Contador de reservas falhadas

#### Dashboard API
- `dashboard_errors` - Taxa de erros
- `dash_appointments_today_duration` - Latência de agendamentos de hoje
- `dash_appointments_week_duration` - Latência de agendamentos da semana
- `dash_clients_list_duration` - Latência de lista de clientes
- `dash_revenue_stats_duration` - Latência de estatísticas
- `dash_overview_duration` - Latência de visão geral

#### Realtime/WebSocket
- `ws_connection_errors` - Taxa de erros de conexão
- `ws_message_latency` - Latência de mensagens
- `ws_connection_duration` - Tempo de conexão
- `ws_subscribe_duration` - Tempo de subscrição
- `ws_reconnect_time` - Tempo de reconexão
- `ws_successful_connections` - Conexões bem-sucedidas
- `ws_failed_connections` - Conexões falhadas
- `ws_messages_received` - Mensagens recebidas
- `ws_messages_sent` - Mensagens enviadas
- `ws_disconnections` - Desconexões

#### Redis Cache
- `cache_errors` - Taxa de erros
- `cache_hit_rate` - Taxa de acertos de cache
- `cache_get_duration` - Latência de operações GET
- `cache_set_duration` - Latência de operações SET
- `cache_invalidate_duration` - Latência de invalidação
- `cache_delete_duration` - Latência de deleção
- `cache_hits` - Contador de hits
- `cache_misses` - Contador de misses

## 🎯 Cenários Disponíveis

### Baseline
- **VUs:** 1
- **Duração:** 5-10 min
- **Objetivo:** Estabelecer referência de performance
- **Uso:** Antes de cada ciclo de desenvolvimento

### Concurrent_10/20/25/50/100
- **VUs:** 10-100 (baseado no teste)
- **Executor:** constant-arrival-rate ou constant-vus
- **Duração:** 5-10 min
- **Objetivo:** Validar performance sob carga constante
- **Uso:** Validação diária e CI/CD

### Stress
- **Executor:** ramping-arrival-rate ou ramping-vus
- **Duração:** 25-30 min
- **Stages:** 5-6 fases de ramp up/down
- **Objetivo:** Encontrar limites do sistema
- **Uso:** Validação antes de release

## 📈 Performance Targets

### Booking API
| Métrica | Target |
|---------|--------|
| p50 latency | < 200ms |
| p95 latency | < 500ms |
| p99 latency | < 800ms |
| Availability | 99.5% |
| Error rate | < 1% |

### Dashboard API
| Métrica | Target |
|---------|--------|
| p50 latency | < 100ms |
| p95 latency | < 200ms |
| p99 latency | < 400ms |
| Availability | 99.9% |
| Error rate | < 0.1% |

### Cache (Redis)
| Métrica | Target |
|---------|--------|
| p50 latency | < 1ms |
| p95 latency | < 5ms |
| p99 latency | < 10ms |
| Hit rate | > 80% |

### Realtime
| Métrica | Target |
|---------|--------|
| Message latency | < 100ms |
| Auto-reconnect | < 5s |
| Connection errors | < 1% |

## 🧹 Cleanup

### Cleanup Completo (Deleta todos os dados de teste)

```bash
k6 run --env DRY_RUN=false tests/load/cleanup.js
```

### Cleanup em Modo Simulação (Não deleta nada)

```bash
k6 run --env DRY_RUN=true tests/load/cleanup.js
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * *'  # 2h diariamente
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup k6
        uses: grafana/k6-action@v0.3.1
        
      - name: Start services
        run: |
          docker-compose up -d
          sleep 30
          
      - name: Setup test data
        run: k6 run tests/load/setup.js
        
      - name: Run booking tests
        run: |
          k6 run --env SCENARIO=concurrent_10 tests/load/load-booking.test.js \
            --out json=booking-results.json
          
      - name: Run dashboard tests
        run: |
          k6 run --env SCENARIO=concurrent_25 tests/load/load-dashboard.test.js \
            --out json=dashboard-results.json
          
      - name: Run cache tests
        run: |
          k6 run --env SCENARIO=concurrent_100 tests/load/load-redis.test.js \
            --out json=cache-results.json
            
      - name: Generate reports
        run: |
          npm install -g k6-reporter
          k6-reporter booking-results.json -o booking-report.html
          k6-reporter dashboard-results.json -o dashboard-report.html
          k6-reporter cache-results.json -o cache-report.html
          
      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: load-test-reports
          path: |
            *-report.html
            *-results.json
            
      - name: Cleanup
        run: k6 run --env DRY_RUN=false tests/load/cleanup.js
        
      - name: Stop services
        run: docker-compose down
```

## 🔍 Troubleshooting

### Teste falha com erro de conexão

**Problema:** Aplicação não está rodando

```bash
# Verificar se aplicação está rodando
curl http://localhost:3000/api/health

# Se não estiver, iniciar
npm run dev
```

### Tempo de resposta muito alto

**Problema:** Bottleneck no servidor ou banco de dados

```bash
# Verificar logs da aplicação
# Verificar uso de CPU/Memória
# Verificar latência do banco de dados
```

### Hit rate do cache muito baixo

**Problema:** Cache não está sendo usado corretamente

```bash
# Verificar se Redis está rodando
redis-cli ping

# Verificar se cache está sendo preenchido
redis-cli KEYS "appointments:*"

# Verificar TTL das chaves
redis-cli TTL appointments:shop_001
```

### WebSocket conexões falham

**Problema:** Supabase realtime não configurado

```bash
# Verificar se Supabase URL e Key estão corretos
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Verificar se realtime está ativado no Supabase
```

### Erros 429 (Too Many Requests)

**Problema:** Rate limiting está muito agressivo

```bash
# Aumentar limites da aplicação
# Reduzir número de VUs nos testes
# Aumentar duração do teste
```

## 📚 Recursos Adicionais

- [k6 Documentation](https://k6.io/docs/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Redis Performance Best Practices](https://redis.io/topics/best-practices)
- [k6 Best Practices](https://k6.io/docs/test-guides/test-optimization/)

## 🤝 Contribuindo

Para adicionar novos testes ou melhorar os existentes:

1. Siga o padrão dos scripts existentes
2. Adicione métricas customizadas relevantes
3. Documente o cenário e objetivos
4. Atualize este README

## 📄 Licença

Este código é parte do projeto BarberZap.
