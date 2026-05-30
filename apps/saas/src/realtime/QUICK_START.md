# 🚀 Quick Start - Supabase Realtime

## ⚡ Setup em 5 Minutos

### 1. Instalar Dependência
```bash
npm install @supabase/supabase-js
```

### 2. Configurar .env
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Executar SQL no Supabase Dashboard
- Acesse: https://supabase.com/dashboard/project/_/sql
- Execute: `/root/barber/src/realtime/supabase-setup.sql`

Ou rápido:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE clients;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### 4. Conectar no main.tsx
```typescript
import { SupabaseRealtimeManager } from '@/realtime';

SupabaseRealtimeManager.connect().catch(console.error);
```

### 5. Usar nos Componentes
```typescript
import { useRealtimeAppointments } from '@/realtime';

function AppointmentsPage() {
  const { data, loading, error } = useRealtimeAppointments('shop-123');
  
  if (loading) return <Loading />;
  if (error) return <Error>{error.message}</Error>;
  
  return (
    <div>
      {data?.map(app => <AppointmentCard key={app.id} {...app} />)}
    </div>
  );
}
```

✅ **Pronto!** Seus componentes agora atualizam em tempo real!

---

## 📚 Hooks Disponíveis

```typescript
useRealtimeAppointments(shopId, options)
useRealtimeClients(shopId, options)
useRealtimeMessages(shopId, options)
useRealtimeNotifications(shopId, options)
```

## 🔗 Links Úteis

- **Doc completa:** [`README.md`](./README.md)
- **Exemplo:** [`examples/AppointmentsListExample.tsx`](./examples/AppointmentsListExample.tsx)
- **Setup SQL:** [`supabase-setup.sql`](./supabase-setup.sql)
