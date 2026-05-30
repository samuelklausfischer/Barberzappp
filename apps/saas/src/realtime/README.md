# Supabase Realtime - BarberZap

Sistema completo de sincronização em tempo real para o BarberZap usando Supabase Realtime.

## 📋 Índice

- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso Básico](#uso-básico)
- [Hooks Disponíveis](#hooks-disponíveis)
- [API do Manager](#api-do-manager)
- [Cache](#cache)
- [Exemplos](#exemplos)
- [Boas Práticas](#boas-práticas)
- [Troubleshooting](#troubleshooting)

## 🚀 Instalação

### 1. Instalar Dependências

```bash
npm install @supabase/supabase-js
```

ou

```bash
yarn add @supabase/supabase-js
```

### 2. Configurar Client Supabase

Crie o arquivo `/root/barber/src/infrastructure/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3. Adicionar Variáveis de Ambiente

No arquivo `.env`:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Habilitar Realtime no Supabase

No dashboard do Supabase, para cada tabela que precisa de realtime:

```sql
-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE clients;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

## ⚙️ Configuração

### Inicializar com Debug

Para ativar logs detalhados:

```typescript
import { SupabaseRealtimeManager } from '@/realtime/SupabaseRealtimeManager';

const manager = SupabaseRealtimeManager.getInstance({
  debug: true,
  maxReconnectAttempts: 5,
  baseReconnectDelay: 1000
});
```

### Conectar ao Iniciar

No `main.tsx` ou `App.tsx`:

```typescript
import { SupabaseRealtimeManager } from '@/realtime/SupabaseRealtimeManager';

// Conecte automaticamente ao iniciar
SupabaseRealtimeManager.connect().catch(console.error);
```

## 🎯 Uso Básico

### Usando Hooks (Recomendado)

```typescript
import { useRealtimeAppointments } from '@/realtime/hooks';

function AppointmentsPage() {
  const {
    data: appointments,
    loading,
    error,
    connectionStatus,
    refetch
  } = useRealtimeAppointments('shop-123');

  if (loading) return <Skeleton />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      <div>Status: {connectionStatus}</div>
      <button onClick={refetch}>Recarregar</button>
      
      {appointments?.map(app => (
        <AppointmentCard key={app.id} {...app} />
      ))}
    </div>
  );
}
```

### Usando o Manager Diretamente

```typescript
import { SupabaseRealtimeManager } from '@/realtime/SupabaseRealtimeManager';

function MyComponent() {
  useEffect(() => {
    const subscription = SupabaseRealtimeManager.subscribe(
      'appointments',
      'shop-123',
      (payload, eventType) => {
        console.log(`Received ${eventType}:`, payload);
      },
      {
        events: ['INSERT', 'UPDATE'],
        onError: (error) => console.error('Error:', error)
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return <div>Listening for changes...</div>;
}
```

## 📦 Hooks Disponíveis

### useRealtimeAppointments

Hook para observar appointments em tempo real.

```typescript
import { useRealtimeAppointments } from '@/realtime/hooks';

const {
  data,              // Appointments[]
  loading,           // boolean
  error,             // Error | null
  connectionStatus,  // ConnectionStatus
  reconnecting,      // boolean
  lastUpdate,        // number | null (timestamp)
  refetch,           // () => Promise<void>
  disconnect         // () => void
} = useRealtimeAppointments('shop-123', {
  initialData: [],           // Dados iniciais
  cacheTTL: 300000,          // 5 minutos de cache
  disableCache: false,       // Usar cache?
  cacheKey: 'all',           // Chave do cache
  filterFn: (app) => app.status !== 'canceled', // Filtro local
  onDataChange: (data) => console.log('Updated:', data),
  onError: (err) => console.error(err),
  onDisconnect: () => console.log('Disconnected'),
  onReconnect: () => console.log('Reconnected')
});
```

### useRealtimeClients

Hook para observar clients em tempo real.

```typescript
import { useRealtimeClients } from '@/realtime/hooks';

const { data: clients, loading } = useRealtimeClients('shop-123');
```

### useRealtimeMessages

Hook para observar messages em tempo real.

```typescript
import { useRealtimeMessages } from '@/realtime/hooks';

const { data: messages, loading } = useRealtimeMessages('shop-123', {
  cacheTTL: 60000, // 1 minuto para mensagens
  cacheKey: 'recent'
});
```

### useRealtimeNotifications

Hook para observar notifications em tempo real.

```typescript
import { useRealtimeNotifications } from '@/realtime/hooks';

const { data: notifications, loading } = useRealtimeNotifications('shop-123', {
  filterFn: (notif) => !notif.read // Apenas não lidas
});
```

### useRealtimeConnectionStatus

Hook para monitorar status da conexão.

```typescript
import { useRealtimeConnectionStatus, ConnectionStatus } from '@/realtime/hooks';

function StatusIndicator() {
  const status = useRealtimeConnectionStatus();
  
  const colors = {
    [ConnectionStatus.CONNECTED]: 'green',
    [ConnectionStatus.DISCONNECTED]: 'red',
    [ConnectionStatus.CONNECTING]: 'yellow',
    [ConnectionStatus.RECONNECTING]: 'orange',
    [ConnectionStatus.ERROR]: 'red'
  };
  
  return (
    <div style={{ color: colors[status] }}>
      {status}
    </div>
  );
}
```

### useRealtimeControl

Hook para controlar conexão manualmente.

```typescript
import { useRealtimeControl } from '@/realtime/hooks';

function ConnectionControl() {
  const { connected, loading, error, connect, disconnect } = useRealtimeControl();
  
  return (
    <div>
      <p>Status: {connected ? 'Connected' : 'Disconnected'}</p>
      {error && <p className="error">{error.message}</p>}
      
      <button 
        onClick={connected ? disconnect : connect}
        disabled={loading}
      >
        {loading ? '...' : (connected ? 'Disconnect' : 'Connect')}
      </button>
    </div>
  );
}
```

## 🔧 API do Manager

### SupabaseRealtimeManager

Singleton com métodos para gerenciar subscriptions.

#### Métodos

```typescript
// Obter instância
const manager = SupabaseRealtimeManager.getInstance(config?: RealtimeManagerConfig);

// Conectar
await manager.connect();

// Desconectar
await manager.disconnect();

// Obter status
const status = manager.getStatus();

// Subscribe
const subscription = manager.subscribe(
  table: RealtimeTable,
  shopId: string,
  callback: ChangeCallback,
  options?: SubscriptionOptions
);

// Unsubscribe
manager.unsubscribe(subscriptionId: string);

// Unsubscribe de um shop específico
manager.unsubscribeAll(shopId?: string);

// Obter subscriptions ativas
const subs = manager.getActiveSubscriptions(shopId?: string);

// Observar mudanças de status
const unsubscribe = manager.onStatusChange(() => {
  console.log('Status changed');
});
```

### Tipos

```typescript
// Tabelas disponíveis
type RealtimeTable = 'appointments' | 'clients' | 'messages' | 'notifications';

// Status de conexão
enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
  RECONNECTING = 'RECONNECTING'
}

// Eventos Realtime
type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';
```

## 💾 Cache

O sistema inclui cache local para melhorar performance.

### Métodos de Cache

```typescript
// Obter do cache
const data = SupabaseRealtimeManager.getFromCache<T>(
  table: RealtimeTable,
  key: string,
  shopId: string
);

// Salvar no cache
SupabaseRealtimeManager.setToCache<T>(
  table: RealtimeTable,
  key: string,
  shopId: string,
  data: T,
  ttl?: number  // padrão: 300000 (5 minutos)
);

// Limpar cache
SupabaseRealtimeManager.clearCache(
  table?: RealtimeTable,
  shopId?: string
);
```

### Cache nos Hooks

```typescript
// Configurar TTL via options
useRealtimeAppointments('shop-123', {
  cacheTTL: 60000, // 1 minuto
  cacheKey: 'today',
  disableCache: false
});

// Acessar cache diretamente
const cached = SupabaseRealtimeManager.getFromCache(
  'appointments',
  'today',
  'shop-123'
);
```

## 📝 Exemplos

### Ver [`AppointmentsListExample.tsx`](./examples/AppointmentsListExample.tsx)

Exemplo completo de componente usando `useRealtimeAppointments`.

### Componente com Múltiplas Subscriptions

```typescript
import { 
  useRealtimeAppointments, 
  useRealtimeClients 
} from '@/realtime/hooks';

function Dashboard() {
  const { data: appointments, loading: loadingApps } = useRealtimeAppointments('shop-123');
  const { data: clients, loading: loadingClients } = useRealtimeClients('shop-123');
  
  if (loadingApps || loadingClients) return <Loading />;
  
  return (
    <div>
      <h1>Dashboard</h1>
      <Stats appointments={appointments || []} clients={clients || []} />
    </div>
  );
}
```

### Componente com Filtro e Actions

```typescript
function AppointmentsWithActions() {
  const { 
    data: appointments, 
    loading,
    refetch 
  } = useRealtimeAppointments('shop-123', {
    filterFn: (app) => app.status === 'confirmed',
    onDataChange: (data) => {
      // Fazer algo quando dados mudarem
      sendNotification(`Você tem ${data.length} appointments confirmados`);
    }
  });
  
  const confirmAppointment = async (id: string) => {
    await updateAppointment(id, { status: 'confirmed' });
    // Não precisa de refetch - atualização é automática via Realtime
  };
  
  if (loading) return <Skeleton />;
  
  return (
    <div>
      <button onClick={() => refetch()}>Recarregar</button>
      
      {appointments?.map(app => (
        <AppointmentCard 
          key={app.id}
          {...app}
          onConfirm={() => confirmAppointment(app.id)}
        />
      ))}
    </div>
  );
}
```

## ✅ Boas Práticas

### 1. Validar shopId

```typescript
function MyComponent({ shopId }: { shopId?: string }) {
  // Não chamar hook com shopId inválido
  if (!shopId) {
    return <div>Selecione uma barbearia</div>;
  }
  
  const { data } = useRealtimeAppointments(shopId);
  // ...
}
```

### 2. Limpeza Automática

Os hooks fazem cleanup automaticamente, mas se usar o Manager diretamente:

```typescript
useEffect(() => {
  const subscription = SupabaseRealtimeManager.subscribe(/* ... */);
  
  return () => {
    subscription.unsubscribe(); // Importante!
  };
}, []);
```

### 3. Tratamento de Erros

```typescript
function MyComponent() {
  const { data, error } = useRealtimeAppointments('shop-123', {
    onError: (err) => {
      toast.error('Erro ao carregar appointments');
      console.error('Realtime error:', err);
    }
  });
  
  if (error) {    
    return <ErrorFallback error={error} />;
  }
  
  // ...
}
```

### 4. Performance com Filtros

Use filtros locais para evitar fetch desnecessários:

```typescript
const { data } = useRealtimeAppointments('shop-123', {
  filterFn: (app) => {
    return app.status === 'confirmed' && 
           new Date(app.date) >= new Date();
  }
});
```

### 5. Múltiplas Instâncias do Hook

Use chaves de cache diferentes para variações da mesma tabela:

```typescript
const todayApps = useRealtimeAppointments('shop-123', {
  cacheKey: 'today',
  filterFn: isToday
});

const upcomingApps = useRealtimeAppointments('shop-123', {
  cacheKey: 'upcoming',
  filterFn: isUpcoming
});
```

## 🐛 Troubleshooting

### Subscriptions não funcionam

**Solução:** Verifique se Realtime está habilitado no Supabase:

```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

### Erro: "Missing Supabase client"

**Solução:** Verifique se o client está configurado em `infrastructure/supabase/client.ts`

### Conexão caindo frequentemente

**Solução:** Aumente as tentativas de reconexão:

```typescript
SupabaseRealtimeManager.getInstance({
  maxReconnectAttempts: 15,
  baseReconnectDelay: 2000
});
```

### Dados não atualizando

**Solução:** Ative debug mode para ver o que está acontecendo:

```typescript
SupabaseRealtimeManager.getInstance({ debug: true });
```

### Memory Leak

**Solução:** Certifique-se que o hook é usado dentro de useEffect com cleanup:

```typescript
✅ Correto:
useEffect(() => {
  const sub = manager.subscribe(...);
  return () => sub.unsubscribe();
}, []);

❌ Incorreto:
useEffect(() => {
  manager.subscribe(...); // Sem cleanup!
}, []);
```

## 📖 Referências

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)

## 🤝 Contribuindo

Ao adicionar novas tabelas para realtime:

1. Atualize o tipo `RealtimeTable` em `SupabaseRealtimeManager.ts`
2. Crie um novo hook em `hooks.ts` seguindo o padrão existente
3. Adicione ao README com exemplos
4. Habilite a publicação no Supabase

## 📄 Licença

Parte do projeto BarberZap Pro.
