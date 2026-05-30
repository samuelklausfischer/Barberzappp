# 📊 DATA_MAP - Índice de Dados

Este documento é um guia rápido para encontrar dados, tipos, queries e everything relacionado a dados no BarberZap Pro.

## 🎯 Objetivo

Encontrar qualquer dado crítico em menos de 2 minutos.

---

## 🗄️ Bancos de Dados

**Status Atual**: Sem banco de dados real (usando mock data)

**Futuro**: Considerando:
- [ ] PostgreSQL (via Supabase)
- [ ] MongoDB (via Atlas)
- [ ] Firebase (Firestore)

**Localização dos dados**:
- Mock data: `src/features/*/mocks/`
- Tipos: `src/domain/types/`

---

## 📋 Tabelas/Coleções por Domínio

### Agendamentos (Appointments)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | ID único |
| `clientName` | string | Nome do cliente |
| `clientAvatar` | string | URL do avatar |
| `service` | string | Nome do serviço |
| `time` | string | Horário (HH:MM) |
| `duration` | string | Duração |
| `price` | number | Preço (R$) |
| `status` | enum | 'confirmed' | 'pending' | 'canceled' |

**Tipo TypeScript**: `src/domain/types/appointment.ts`
**Mock Data**: `src/features/appointments/mocks/mockAppointments.ts`
**Hook**: `src/features/appointments/hooks/useAppointments.ts`

---

### Serviços (Services)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | ID único |
| `name` | string | Nome do serviço |
| `description` | string | Descrição |
| `price` | number | Preço (R$) |
| `duration` | number | Duração (minutos) |
| `popular` | boolean | É popular? |
| `icon` | string | Ícone (Material Symbol) |

**Tipo TypeScript**: `src/domain/types/service.ts`
**Mock Data**: `src/features/services/mocks/mockServices.ts`
**Hook**: `src/features/services/hooks/useServices.ts`

---

### Usuários (Users)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | ID único |
| `name` | string | Nome completo |
| `role` | string | Papel (admin, barber, etc.) |
| `avatar` | string | URL do avatar |
| `email` | string | Email (futuro) |

**Tipo TypeScript**: `src/domain/types/common.ts`
**Hook**: `src/features/auth/hooks/useAuth.ts`

---

### Estatísticas Financeiras (FinancialStats)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `revenue` | number | Receita total |
| `growth` | number | Crescimento (%) |
| `ticketMedio` | number | Ticket médio |
| `appointmentsCount` | number | Total de agendamentos |
| `newClients` | number | Novos clientes |

**Tipo TypeScript**: `src/domain/types/financial.ts`

---

## 🔍 Onde Estão os Repositories

**Status Atual**: Sem repositories (usando hooks + mocks)

**Estrutura Futura**:
```
src/data/
├── repositories/
│   ├── appointments.repository.ts
│   ├── services.repository.ts
│   └── users.repository.ts
├── queries/
│   ├── appointments.queries.ts
│   └── services.queries.ts
└── mappers/
    └── data.mapper.ts
```

---

## 📝 Queries Principais

**Status Atual**: Mock data direto em hooks

**Exemplos de Queries (Futuro)**:

### Buscar Agendamentos
```typescript
// src/data/queries/appointments.queries.ts
export const getAppointmentsByDate = (date: Date): Appointment[] => {
  // query implementation
}
```

### Buscar Serviços
```typescript
// src/data/queries/services.queries.ts
export const getServices = (): Service[] => {
  // query implementation
}
```

### Buscar Estatísticas Financeiras
```typescript
// src/data/queries/financial.queries.ts
export const getFinancialStats = (period: Period): FinancialStats => {
  // query implementation
}
```

---

## 🗂️ Migrations e Seeds

**Status Atual**: Sem migrations/seeds (mock data estático)

**Estrutura Futura**:
```
scripts/
├── migrations/
│   ├── 001_create_appointments_table.sql
│   ├── 002_create_services_table.sql
│   └── 003_create_users_table.sql
└── seeds/
    ├── seed_appointments.ts
    ├── seed_services.ts
    └── seed_users.ts
```

---

## 📄 Exemplos de Payloads

### Payload de Agendamento

```typescript
{
  "id": "1",
  "clientName": "João Silva",
  "clientAvatar": "https://picsum.photos/id/64/100/100",
  "service": "Corte Navalhado",
  "time": "14:00",
  "duration": "30 min",
  "price": 45,
  "status": "confirmed"
}
```

### Payload de Serviço

```typescript
{
  "id": "1",
  "name": "Corte de Cabelo",
  "description": "Degradê, Social e Tesoura",
  "price": 45,
  "duration": 45,
  "popular": true,
  "icon": "content_cut"
}
```

### Payload de Estatísticas Financeiras

```typescript
{
  "revenue": 4520.00,
  "growth": 12.5,
  "ticketMedio": 45.00,
  "appointmentsCount": 142,
  "newClients": 15
}
```

---

## 🔧 Onde Logar para Debugar

### Logs de Console

**Lugares principais**:
- `src/features/ai/hooks/useAIChat.ts` - Logs de chamadas IA
- `src/infrastructure/ai/geminiService.ts` - Erros da API Gemini
- Hooks de dados (useAppointments, useServices) - Logs de data fetching

**Exemplo**:
```typescript
console.log('[AI Service] Generating response:', prompt);
console.error('[Gemini Error]', error);
```

### Logs de Rede

**Ferramentas**:
- Chrome DevTools → Network tab
- Filtrar por: `XHR`, `fetch`
- Ver chamadas para API Gemini

### Logs de Estado

**React DevTools**:
- Instalar extensão React DevTools
- Componentes → Ver estado e props
- Profiler → Performance

---

## 🔄 Fluxo de Dados por Funcionalidade

### 1. Agendamentos

```
Mock Data
  ↓
useAppointments hook
  ↓
Agenda Component
  ↓
Appointment Cards
  ↓
User Action (Edit/Delete)
  ↓
Hook Update (futuro)
  ↓
Repository (futuro)
  ↓
Database (futuro)
```

### 2. Serviços

```
Mock Data
  ↓
useServices hook
  ↓
ServicesList Component
  ↓
Service Cards
  ↓
User Action (Add/Edit/Delete)
  ↓
Hook Update (futuro)
  ↓
Repository (futuro)
  ↓
Database (futuro)
```

### 3. IA/Chat

```
User Input
  ↓
useAIChat hook
  ↓
Gemini Service
  ↓
Google Gemini API
  ↓
Response
  ↓
Update State
  ↓
Chat UI
```

### 4. Financeiro

```
Mock Data
  ↓
Finance Component
  ↓
Recharts
  ↓
Visualização
```

---

## 🗂️ Mappers

**Status Atual**: Sem mappers (data direto)

**Futuro**:
```typescript
// src/data/mappers/appointment.mapper.ts
export const mapApiToAppointment = (apiData: any): Appointment => {
  // mapeamento de campos
}

export const mapAppointmentToApi = (appointment: Appointment): any => {
  // mapeamento inverso
}
```

---

## 🎯 Data Access Patterns

### Padrão Atual: Hook-based

```typescript
// Componente
const { appointments, loading, error } = useAppointments();

// Hook
export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  // ...
}
```

### Padrão Futuro: Repository-based

```typescript
// Repository
class AppointmentsRepository {
  async getAll(): Promise<Appointment[]> { }
  async getById(id: string): Promise<Appointment> { }
  async create(appointment: Appointment): Promise<Appointment> { }
  async update(id: string, appointment: Appointment): Promise<Appointment> { }
  async delete(id: string): Promise<void> { }
}

// Hook usa repository
export const useAppointments = () => {
  const repository = new AppointmentsRepository();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    repository.getAll().then(setAppointments);
  }, []);

  return { appointments };
}
```

---

## 📊 Estrutura de Dados Sugerida

```
src/data/
├── repositories/           # Camada de acesso a dados
│   ├── appointments.repository.ts
│   ├── services.repository.ts
│   ├── users.repository.ts
│   └── financial.repository.ts
│
├── queries/                # Queries específicas
│   ├── appointments.queries.ts
│   ├── services.queries.ts
│   └── financial.queries.ts
│
├── mappers/                # Mapeamento de dados
│   ├── appointment.mapper.ts
│   ├── service.mapper.ts
│   └── api.mapper.ts
│
├── schemas/                # Schemas de validação
│   ├── appointment.schema.ts
│   ├── service.schema.ts
│   └── user.schema.ts
│
├── mock/                   # Dados mock organizados
│   ├── appointments.mock.ts
│   ├── services.mock.ts
│   └── users.mock.ts
│
└── types/                  # Tipos específicos de dados
    ├── api.types.ts
    └── db.types.ts
```

---

## 🚨 Problemas Comuns com Dados

### 1. Dados não atualizando

**Sintoma**: Alterações não aparecem na UI

**Debugar**:
1. Verificar hook de data fetching
2. Verificar se estado está sendo atualizado
3. Verificar re-render do componente

### 2. Erro de tipo

**Sintoma**: Type error em propriedade

**Debugar**:
1. Verificar tipos em `src/domain/types/`
2. Comparar com mock data
3. Verificar mapper (se existir)

### 3. Dados duplicados

**Sintoma**: Mesmo dado aparece múltiplas vezes

**Debugar**:
1. Verificar key no map/forEach
2. Verificar se há duplicação em mocks
3. Verificar se hook está sendo chamado múltiplas vezes

### 4. API não retornando dados

**Sintoma**: Dados undefined ou vazio

**Debugar**:
1. Verificar Network tab
2. Verificar logs no service
3. Verificar se API key está configurada

---

## ✅ Checklist de Dados

- [ ] Entendi onde estão os tipos
- [ ] Sei onde encontrar mock data
- [ ] Entendi o fluxo de dados por funcionalidade
- [ ] Sei onde logar para debugar
- [ ] Conheço os payloads esperados
- [ ] Entendi padrão atual (hook-based)
- [ ] Entendi padrão futuro (repository-based)

---

## 📚 Documentação Relacionada

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura e padrões
- [MAP.md](./MAP.md) - Índice do projeto
- [RUNBOOKS/](./RUNBOOKS/) - Runbooks operacionais
- [START_HERE.md](./START_HERE.md) - Guia de onboarding

---

**Última atualização**: 2026-03-03
**Responsável**: Dev Sênior
