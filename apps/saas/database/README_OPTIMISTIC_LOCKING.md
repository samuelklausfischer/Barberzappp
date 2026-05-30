# BarberZap - Optimistic Locking Implementation

Documentação completa do sistema de Optimistic Locking para prevenir conflitos de concorrência e double-booking.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Instalação](#instalação)
4. [SQL: Funções Atômicas](#sql-funções-atômicas)
5. [TypeScript: Frontend Hook](#typescript-frontend-hook)
6. [Python: Backend Utils](#python-backend-utils)
7. [Fluxo de Resolução de Conflitos](#fluxo-de-resolução-de-conflitos)
8. [Exemplos de Uso](#exemplos-de-uso)
9. [Monitoramento e Debugging](#monitoramento-e-debugging)
10. [FAQ](#faq)

---

## 🎯 Visão Geral

### Problema

Race conditions em sistemas de agendamento causam:
- **Double-booking**: 2 clientes marcam o mesmo horário simultaneamente
- **Lost updates**: 2 usuários editam o mesmo agendamento
- **Concurrent cancellations**: Cancelamento simultâneo causa inconsistências
- **Perda de receita**: Horários vendidos 2x para clientes diferentes

### Solução

**Optimistic Locking** com:
- ✅ Versionamento automático de registros
- ✅ Funções atômicas SQL para booking, update e cancel
- ✅ Detecção automática de conflitos
- ✅ Retry com exponential backoff (3x)
- ✅ Log completo em audit_logs
- ✅ Notificação ao usuário quando conflito persiste

---

## 🏗 Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────────┤
│  useAppointmentMutations() Hook                                 │
│  ├── bookAppointmentAtomic()  → supabase.rpc('book_...')       │
│  ├── updateAppointmentAtomic() → supabase.rpc('update_...')     │
│  └── cancelAppointmentAtomic() → supabase.rpc('cancel_...')    │
│                                                                 │
│  useOptimisticUpdate() Hook                                    │
│  ├── Detect Version mismatch                                    │
│  ├── Retry automático (3x + exponential backoff)                │
│  └── ShowConflictNotification()                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       POSTGRESQL / SUPABASE                       │
├─────────────────────────────────────────────────────────────────┤
│  book_appointment_atomic(p_shop_id, p_client_id, ...)           │
│  ├── Verifica disponibilidade do slot                           │
│  ├── Previne double-booking                                     │
│  ├── Cria appointment com version=1                             │
│  └── Log em audit_logs                                          │
│                                                                 │
│  update_appointment_atomic(p_id, p_version, p_updates)          │
│  ├── Checa version (optimistic lock)                            │
│  ├── Se mismatch → retorna erro                                 │
│  ├── Verifica disponibilidade se mudou data/hr                   │
│  ├── Incrementa version                                         │
│  └── Log em audit_logs                                          │
│                                                                 │
│  cancel_appointment_atomic(p_id, p_version, p_reason)          │
│  ├── Checa version                                              │
│  ├── Altera status para 'cancelled'                             │
│  └── Log em audit_logs                                          │
│                                                                 │
│  Triggers:                                                      │
│  ├── increment_appointment_version()  → UPDATE appointments     │
│  ├── increment_client_version()         → UPDATE clients        │
│  ├── increment_service_version()        → UPDATE services       │
│  └── increment_employee_version()       → UPDATE employees      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Python - Opcional)                   │
├─────────────────────────────────────────────────────────────────┤
│  conflict_resolution.py                                         │
│  ├── detect_conflict(exception) → bool                          │
│  ├── handle_conflict_with_retry(operation, config)              │
│  ├── log_conflict(shop_id, type, details)                       │
│  └── get_conflict_stats(shop_id)                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Instalação

### 1. Aplicar Scripts SQL

```bash
# Conectar ao PostgreSQL/Supabase
psql -h host -U user -d dbname

# Executar script
psql -f database/02_optimistic_locking.sql
```

Ou via Supabase Dashboard:
1. Acesse SQL Editor
2. Cole o conteúdo de `02_optimistic_locking.sql`
3. Execute

### 2. Verificar Instalação

```sql
-- Verificar se funções foram criadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema='public' 
  AND routine_name LIKE '%atomic%';

-- Verificar se triggers foram criados
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_schema='public';

-- Verificar se views foram criadas
SELECT table_name 
FROM information_schema.views 
WHERE table_schema='public' 
  AND table_name LIKE '%conflict%';
```

### 3. Importar Utilitários

**TypeScript:**

```typescript
// No seu componente
import { 
  useAppointmentMutations,
  ConflictError,
  showConflictNotification 
} from '@/utils/optimisticLock';
```

**Python (Opcional para backend personalizado):**

```python
from backend.utils.conflict_resolution import (
    ConflictResolutionError,
    handle_conflict_with_retry,
    log_conflict,
    get_conflict_stats
)
```

---

## 🗄 SQL: Funções Atômicas

### book_appointment_atomic()

Cria agendamento com verificação de slot (previne double-booking).

#### Parâmetros

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| p_shop_id | UUID | ID da loja |
| p_client_id | UUID | ID do cliente |
| p_employee_id | UUID | ID do funcionário |
| p_service_id | UUID | ID do serviço |
| p_scheduled_at | TIMESTAMPTZ | Data/hora do agendamento |
| p_version | INTEGER | Versão inicial (default: 1) |
| p_notes | TEXT | Notas (opcional) |

#### Retorno

```json
{
  "success": true,
  "code": "success",
  "message": "Appointment booked successfully",
  "data": {
    "appointment_id": "uuid",
    "shop_id": "uuid",
    "client_id": "uuid",
    "client_name": "João Silva",
    "employee_id": "uuid",
    "employee_name": "Marcos Barbearia",
    "service_id": "uuid",
    "service_name": "Corte Cabelo",
    "scheduled_at": "2026-03-04T14:00:00+00",
    "scheduled_end": "2026-03-04T14:30:00+00",
    "duration_minutes": 30,
    "price": 50.00,
    "version": 1
  }
}
```

#### Códigos de Erro

| Code | Mensagem | Causa |
|------|----------|-------|
| `version_mismatch` | N/A (não aplicável) | N/A |
| `slot_not_available` | Time slot is already booked | Double-booking detectado |
| `service_unavailable` | Service not found or inactive | Serviço não existe/inativo |
| `employee_unavailable` | Employee not found or inactive | Funcionário não existe/inativo |

### update_appointment_atomic()

Atualiza agendamento com verificação de versão.

#### Parâmetros

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| p_appointment_id | UUID | ID do agendamento |
| p_shop_id | UUID | ID da loja |
| p_expected_version | INTEGER | Versão esperada (do último read) |
| p_updates | JSONB | Campos a atualizar |

#### Retorno

```json
{
  "success": true,
  "code": "success",
  "message": "Appointment updated successfully",
  "data": {
    "id": "uuid",
    "shop_id": "uuid",
    "client_id": "uuid",
    "employee_id": "uuid",
    "service_id": "uuid",
    "scheduled_at": "2026-03-04T15:00:00+00",
    "status": "confirmed",
    "notes": "Nova nota",
    "version": 2  // Incrementado!
  }
}
```

#### Códigos de Erro

| Code | Mensagem | Causa |
|------|----------|-------|
| `version_mismatch` | Appointment was modified by another user... | Outro usuário atualizou |
| `slot_not_available` | Time slot conflict... | Novo horário já ocupado |
| `not_found` | Appointment not found | Agendamento deletado |
| `permission_denied` | Appointment does not belong to this shop | Shop errada |

### cancel_appointment_atomic()

Cancela agendamento com verificação de versão.

#### Parâmetros

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| p_appointment_id | UUID | ID do agendamento |
| p_shop_id | UUID | ID da loja |
| p_expected_version | INTEGER | Versão esperada |
| p_reason | TEXT | Motivo do cancelamento (opcional) |

#### Retorno

```json
{
  "success": true,
  "code": "success",
  "message": "Appointment cancelled successfully",
  "data": {
    "appointment_id": "uuid",
    "shop_id": "uuid",
    "client_id": "uuid",
    "status": "cancelled",
    "version": 3  // Incrementado!
  }
}
```

---

## ⚛ TypeScript: Frontend Hook

### useAppointmentMutations()

Hook principal para operações de agendamento com optimistic lock.

#### Exemplo de Uso

```tsx
import { useAppointmentMutations } from '@/utils/optimisticLock';

function BookingComponent({ shopId, customerId }) {
  const {
    book,
    update,
    cancel,
    isBusy,
    isRetrying,
    conflict,
    resetAll
  } = useAppointmentMutations(shopId, {
    onSuccess: () => {
      toast.success('Agendamento realizado com sucesso!');
    },
    onConflict: (conflictError) => {
      if (conflictError.isVersionMismatch()) {
        toast.error(
          'Dados desatualizados. Atualize a página.'
        );
      } else if (conflictError.isSlotConflict()) {
        toast.error(
          'Horário já ocupado. Escolha outro.'
        );
      }
    }
  });

  const handleBook = async () => {
    try {
      // Book atômico verifica slot automaticamente
      const result = await book.atomic(
        customerId,
        employeeId,
        serviceId,
        '2026-03-04T14:00:00+00',
        'Nota opcional'
      );

      if (result.success) {
        console.log('Appointment created:', result.data);
      }
    } catch (error) {
      console.error('Booking failed:', error);
      // Conflito já tratado no onConflict
    }
  };

  return (
    <div>
      <button 
        onClick={handleBook}
        disabled={isBusy}
      >
        {isRetrying ? 'Re-tentando...' : 'Agendar'}
      </button>
    </div>
  );
}
```

### Hook para Update com Version Check

```tsx
import { useMutationWithOptimisticLock } from '@/utils/optimisticLock';

function AppointmentEditor({ appointment }) {
  const { mutate, isPending, conflict } = useMutationWithOptimisticLock(
    'appointments',
    ['appointments'],
    {
      onSuccessMsg: 'Agendamento atualizado!',
      onConflict: (error) => {
        // Mostrar modal de conflito
        setShowConflictModal(true);
      }
    }
  );

  const handleUpdate = async () => {
    // Pega a versão atual
    const expectedVersion = appointment.version;
    
    try {
      await mutate(
        appointment.id,
        {
          scheduled_at: newTime,
          notes: newNotes
        },
        expectedVersion  // ⚠ CRÍTICO: passar versão!
      );
    } catch (error) {
      // Erro já tratado pelo onConflict
    }
  };

  if (conflict?.isVersionMismatch()) {
    return (
      <ConflictModal
        message={`Versão ${conflict.expected_version} → ${conflict.current_version}`}
        onRefresh={() => window.location.reload()}
      />
    );
  }

  return <button onClick={handleUpdate}>Salvar</button>;
}
```

### useOptimisticUpdate()

Hook genérico para qualquer tabela.

```tsx
import { useOptimisticUpdate } from '@/utils/optimisticLock';

function ServiceEditor({ service }) {
  const { update, isPending, error } = useOptimisticUpdate(
    'services',
    {
      onSuccess: () => toast.success('Serviço atualizado!')
    }
  );

  const handleUpdate = async (updates) => {
    const result = await update(
      service.id,
      updates,
      service.version  // ⚠ Passar versão atual
    );

    if (!result.success && result.code === 'version_mismatch') {
      toast.error('Conflito de versão!');
    }
  };

  return <form onSubmit={handleUpdate}>...</form>;
}
```

---

## 🐍 Python: Backend Utils

### detect_conflict()

Detecta se uma exceção é um conflito.

```python
from backend.utils.conflict_resolution import (
    detect_conflict,
    ConflictResolutionError
)

try:
    # Alguma operação
    result = supabase.table('appointments').update(...).execute()
except Exception as e:
    if detect_conflict(e):
        print("Foi um conflito de concorrência!")
    else:
        raise
```

### handle_conflict_with_retry()

Wrapper com retry automático.

```python
from backend.utils.conflict_resolution import (
    handle_conflict_with_retry,
    RetryConfig,
    ConflictType
)

def update_appointment(appointment_id, updates, version):
    def operation():
        return supabase.table('appointments')\
            .update(updates)\
            .eq('id', appointment_id)\
            .eq('version', version)\
            .execute()
    
    config = RetryConfig(
        max_retries=4,  # Mais tentativas
        base_delay_ms=300,  # Começa mais rápido
        max_delay_ms=8000,
        retry_on_conflict_codes=[
            ConflictType.VERSION_MISMATCH,
            ConflictType.SLOT_CONFLICT
        ],
        on_retry_callback=lambda attempt, err: 
            print(f"Tentativa {attempt}: {err}")
    )
    
    result = handle_conflict_with_retry(
        supabase=supabase,
        operation=operation,
        config=config,
        shop_id=shop_id,
        table_name='appointments',
        record_id=appointment_id
    )
    
    return result
```

### Decorator

```python
from backend.utils.conflict_resolution import with_conflict_retry

@with_conflict_retry(
    supabase=supabase,
    shop_id="shop-uuid",
    table_name="appointments",
    config=RetryConfig(max_retries=3)
)
def book_appointment(client_id, employee_id, service_id, scheduled_at):
    return supabase.rpc('book_appointment_atomic', {
        'p_shop_id': "shop-uuid",
        'p_client_id': client_id,
        'p_employee_id': employee_id,
        'p_service_id': service_id,
        'p_scheduled_at': scheduled_at
    }).execute()
```

### get_conflict_stats()

Obter estatísticas de conflitos.

```python
from backend.utils.conflict_resolution import get_conflict_stats

stats = get_conflict_stats(supabase, shop_id="shop-uuid")

for stat in stats:
    print(f"Table: {stat.table_name}")
    print(f"  Total conflicts: {stat.total_conflicts}")
    print(f"  Version mismatches: {stat.version_mismatches}")
    print(f"  Double bookings: {stat.double_bookings}")
```

---

## 🔄 Fluxo de Resolução de Conflitos

### Fluxo Completo

```
1. FRONTEND: Read dados
   └─ SELECT * FROM appointments WHERE id = X
      → Recebe version = N

2. FRONTEND: Usuário edita
   └─ Usuario clica em "Salvar"
      → Envia version = N junto com updates

3. FRONTEND: Update
   └─ updateAppointmentAtomic(N, { ... })
      → Backend recebe version esperada

4. BACKEND: Função SQL
   ├─ SELECT version FROM appointments WHERE id = X
   ├─ Se version atual = N
   │  └─ UPDATE appointments SET ..., version = N+1
   │     → Sucesso!
   └─ Se version atual = N+1
      └─ Retorna erro: version_mismatch

5. FRONTEND: Handling
   ├─ Recebe erro version_mismatch
   ├─ Chama detectConflict()
   ├─ isRetrying = true
   ├─ Refreshes dados (novo version = N+1)
   ├─ Re-aplica changes
   └─ Retry (até 3x)

6. Se falhar 3x:
   ├─ Mostra notificação ao usuário
   ├─ "Dados desatualizados. Clique para atualizar."
   └─ Log conflito em audit_logs
```

### Exemplo Detalhado: Double-Booking

```typescript
// Cliente A abre horário 14:00
const { data: slotA } = await supabase
  .from('appointments')
  .select('*')
  .eq('scheduled_at', '2026-03-04T14:00:00+00')
  .single();

// slotA = null → horário disponível

// Cliente B abre mesmo horário (SIMULTANEAMENTE)
const { data: slotB } = await supabase
  .from('appointments')
  .select('*')
  .eq('scheduled_at', '2026-03-04T14:00:00+00')
  .single();

// slotB = null → horário disponível

// Cliente A clica "Agendar" (primeiro)
const resultA = await bookAppointmentAtomic({
  shop_id: 'shop-1',
  client_id: 'client-a',
  employee_id: 'barber-1',
  service_id: 'cut',
  scheduled_at: '2026-03-04T14:00:00+00'
});
// resultA.success = true ✅
// Appointment criado com version = 1

// Cliente B clica "Agendar" (milissegundos depois)
const resultB = await bookAppointmentAtomic({
  shop_id: 'shop-1',
  client_id: 'client-b',
  employee_id: 'barber-1',
  service_id: 'cut',
  scheduled_at: '2026-03-04T14:00:00+00'
});
// resultB.success = false ❌
// resultB.code = 'slot_not_available'
// resultB.message = 'Time slot is already booked'

// Frontend detecta e mostra erro
if (!resultB.success && resultB.code === 'slot_not_available') {
  showConflictNotification({
    message: 'Horário já ocupado por outro cliente!',
    type: 'slot_conflict'
  });
}
```

---

## 📖 Exemplos de Uso

### Exemplo 1: Sistema de Agendamento Completo

```tsx
import { useAppointmentMutations } from '@/utils/optimisticLock';

function AppointmentBookingSystem({ shopId }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  
  const {
    book,
    isBusy,
    isRetrying,
    conflict
  } = useAppointmentMutations(shopId, {
    onSuccess: (data) => {
      toast.success(`Agendamento #${data.appointment_id} criado!`);
      setSelectedSlot(null);
    },
    onConflict: (error) => {
      if (error.isSlotConflict()) {
        toast.error(
          `O horário de ${formatTime(selectedSlot)} já foi ocupado. ` +
          'Por favor, escolha outro horário.'
        );
      } else {
        toast.error('Erro ao agendar. Tente novamente.');
      }
    }
  });

  const handleBook = async (employeeId, clientId) => {
    if (!selectedSlot || !selectedService) return;

    try {
      const result = await book.atomic(
        clientId,
        employeeId,
        selectedService.id,
        selectedSlot.iso,
        'Agendamento via App'
      );

      if (result.success) {
        console.log('Booking confirmed:', result.data);
      }
    } catch (error) {
      // Conflito já tratado pelo onConflict
    }
  };

  return (
    <div>
      <TimeSlots onSelect={setSelectedSlot} />
      <Services onSelect={setSelectedService} />
      
      <button
        onClick={() => handleBook(barberId, currentClientId)}
        disabled={isBusy || !selectedSlot || !selectedService}
      >
        {isRetrying 
          ? 'Verificando disponibilidade...' 
          : 'Confirmar Agendamento'
        }
      </button>
    </div>
  );
}
```

### Exemplo 2: Editar Agendamento

```tsx
import { useAppointmentMutations, formatConflictErrorMessage } from '@/utils/optimisticLock';

function AppointmentEditor({ appointment, onClose }) {
  const [newTime, setNewTime] = useState(appointment.scheduled_at);
  const [showConflictModal, setShowConflictModal] = useState(false);
  
  const {
    update,
    isPending,
    isRetrying,
    conflict
  } = useAppointmentMutations(appointment.shop_id, {
    onSuccess: () => {
      toast.success('Agendamento atualizado!');
      onClose();
    },
    onConflict: (error) => {
      setShowConflictModal(true);
    }
  });

  const handleSave = async () => {
    try {
      // ⚠ CRÍTICO: passar version atual
      const result = await update.atomic(
        appointment.id,
        appointment.version,
        {
          scheduled_at: newTime,
          notes: 'Cliente solicitou mudança'
        }
      );

      if (result.success) {
        console.log('Updated:', result.data);
      }
    } catch (error) {
      // Tratado no onConflict
    }
  };

  const handleRefreshData = async () => {
    // Fetch dados mais recentes
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointment.id)
      .single();
    
    // Atualizar estado local
    setShowConflictModal(false);
  };

  return (
    <div>
      <input
        type="datetime-local"
        value={newTime}
        onChange={(e) => setNewTime(e.target.value)}
      />
      
      <button onClick={handleSave} disabled={isPending}>
        {isRetrying ? 'Re-tentando...' : 'Salvar'}
      </button>

      {showConflictModal && conflict && (
        <ConflictModal
          title="Conflito Detectado"
          message={formatConflictErrorMessage(conflict)}
          details={
            conflict.isVersionMismatch()
              ? `Versão desatualizada: ${conflict.expected_version} → ${conflict.current_version}`
              : 'Horário já ocupado'
          }
          onRefresh={handleRefreshData}
          onClose={() => setShowConflictModal(false)}
        />
      )}
    </div>
  );
}
```

### Exemplo 3: Cancelar Agendamento

```tsx
function AppointmentActions({ appointment }) {
  const {
    cancel,
    isPending
  } = useAppointmentMutations(appointment.shop_id);

  const handleCancel = async (reason) => {
    try {
      const result = await cancel.atomic(
        appointment.id,
        appointment.version,
        reason
      );

      if (result.success) {
        toast.success('Agendamento cancelado!');
      }
    } catch (error) {
      // Conflito tratado automaticamente
    }
  };

  return (
    <button
      onClick={() => {
        const reason = prompt('Motivo do cancelamento:');
        if (reason) {
          handleCancel(reason);
        }
      }}
      disabled={isPending}
    >
      Cancelar Agendamento
    </button>
  );
}
```

---

## 📊 Monitoramento e Debugging

### Ver Conflitos Recentes

```sql
-- Últimos 50 conflitos
SELECT 
  id,
  shop_id,
  table_name,
  record_id,
  (old_data->>'conflict_type') as conflict_type,
  changed_at,
  changed_by,
  EXTRACT(EPOCH FROM (NOW() - changed_at))::INTEGER / 60 as minutes_ago
FROM v_recent_conflicts
ORDER BY changed_at DESC
LIMIT 50;
```

### Estatísticas por Loja

```sql
-- Estatísticas dos últimos 30 dias
SELECT * FROM v_conflict_statistics
WHERE shop_id = 'your-shop-uuid';
```

### Stats via SQL Function

```sql
-- Todos os conflitos
SELECT * FROM get_conflict_stats(NULL);

-- Uma loja específica
SELECT * FROM get_conflict_stats('your-shop-uuid');
```

### View de Health

```sql
-- Quantidade de conflitos por tipo
SELECT 
  shop_id,
  COUNT(*) FILTER (WHERE (old_data->>'conflict_type') = 'version_mismatch') as versions,
  COUNT(*) FILTER (WHERE (old_data->>'conflict_type') = 'double_booking') as double_booking,
  COUNT(*) FILTER (WHERE (old_data->>'conflict_type') = 'slot_conflict') as slot_conflicts,
  COUNT(*) as total
FROM audit_logs
WHERE action = 'CONFLICT'
  AND changed_at > NOW() - INTERVAL '7 days'
GROUP BY shop_id;
```

### Monitor com Hook React

```tsx
import { useConflictMonitor } from '@/utils/optimisticLock';

function AdminDashboard({ shopId }) {
  const {
    conflicts,
    conflictCount,
    isLoading
  } = useConflictMonitor(shopId, true);

  return (
    <div>
      <h2>Monitor de Conflitos</h2>
      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <div>
          <div className="alert">
            Total de conflitos: {conflictCount}
          </div>
          <table>
            <thead>
              <tr>
                <th>Tabela</th>
                <th>Tipo</th>
                <th>Qtd</th>
              </tr>
            </thead>
            <tbody>
              {conflicts.map(c => (
                <tr key={c.table_name}>
                  <td>{c.table_name}</td>
                  <td>{c.total_conflicts}</td>
                  <td>
                    {c.by_type?.version_mismatch || 0} version,
                    {c.by_type?.double_booking || 0} booking
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

---

## ❓ FAQ

### Q: Por que usar Optimistic Locking em vez de Pessimistic Lock?

**A: Optimistic Locking** é melhor para sistemas web com:
- Muitos reads, poucos writes
- Latência de rede não previsível
- Conexões webstateless
- ❌ Menos overhead no banco (nenhum lock mantido)
- ❌ Sem deadlocks
- ❌ Melhor UX (usuário não espera bloqueios)

**Pessimistic Locking** (SELECT FOR UPDATE) só é indicado para:
- Operações de longa duração
- Transações complexas multi-statement
- Sistemas financeiros críticos
- ✅ Garantia absoluta de consistência
- ✅ Previene conflitos no inicio
- ❌ Pode causar espera longa
- ❌ Bloqueia outros usuários

### Q: Quantos retries são recomendados?

**A:** 3-4 retries é um bom balanço entre UX e performance:

```typescript
const config = RetryConfig({
  maxRetries: 3,  // 500ms, 1s, 2s = total 3.5s de espera
  baseDelayMs: 500,
  maxDelayMs: 3000
});
```

Mais retries: melhor chance de sucesso, mas UX pior (espera mais).
Menos retries: UX mais rápida, mas mais erros para usuário.

### Q: E se o usuário clicar "Cancelar" enquanto retry?

**A:** Use AbortController:

```typescript
const abortController = useRef<AbortController>(null);

const update = async () => {
  if (abortController.current) {
    abortController.current.abort();
  }
  
  abortController.current = new AbortController();
  
  try {
    await operation(abortController.current.signal);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Operação cancelada');
      return;
    }
    throw error;
  }
};
```

### Q: Como testar conflitos?

```typescript
// Teste 1: Simular race condition
async function testDoubleBooking() {
  const slot = '2026-03-04T14:00:00+00';
  
  // 2 requisições simultâneas
  const [result1, result2] = await Promise.all([
    bookAppointmentAtomic({
      client_id: 'client-1',
      employee_id: 'barber-1',
      service_id: 'cut',
      scheduled_at: slot
    }),
    bookAppointmentAtomic({
      client_id: 'client-2',
      employee_id: 'barber-1',
      service_id: 'cut',
      scheduled_at: slot
    })
  ]);
  
  // Uma deve falhar
  console.assert(
    result1.success || result2.success,
    'Pelo menos um deve sucesso?'
  );
  console.assert(
    !result1.success || !result2.success,
    'Apenas um deve sucesso!'
  );
}
```

### Q: Devo implementar em Python também?

**A:** Depende da arquitetura:

- **Supabase direto** (frontend → Supabase): Só TypeScript necessário
- **Backend API** (frontend → backend → Supabase): Use Python também
  - Adicione retry no backend
  - Log conflitos com mais contexto
  - Real-time notifications via WebSockets

### Q: Como limpar logs antigos?

```sql
-- Manter apenas conflitos dos últimos 90 dias
DELETE FROM audit_logs
WHERE action = 'CONFLICT'
  AND changed_at < NOW() - INTERVAL '90 days';

-- Criar função periódica (via cron)
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'clean-old-conflicts',
  '0 2 * * *',  -- 2 AM diariamente
  $$
  DELETE FROM audit_logs
  WHERE action = 'CONFLICT'
    AND changed_at < NOW() - INTERVAL '90 days'
  $$
);
```

---

## 📚 Referências

- [PostgreSQL: rowversion/optimistic locking](https://www.postgresql.org/docs/current/ddl-concurrency.html)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Advisory Locks](https://www.postgresql.org/docs/current/functions-admin.html#ADVISORY-LOCKS)

---

## 🤝 Contribuindo

Para melhorar o sistema:

1. Adicionar mais conflito types
2. Implementar métricas em tempo real
3. Criar dashboard administrativo
4. Adicionar testes automatizados

---

**BarberZap - Optimistic Locking v1.0**
FASE 1.5 - Item 1.5
Data: 2026-03-04
