# BarberZap - Frontend Integration with RLS

## 🚀 Quick Start Example

This guide shows how to integrate the BarberZap frontend with Row Level Security (RLS) enabled in Supabase.

## 📦 Setup

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
npm install @tanstack/react-query  # for data fetching
```

### 2. Configuration

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth context provider
export async function getShopSupabaseClient() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  const shopId = user.user_metadata?.shop_id;
  
  if (!shopId) {
    throw new Error('No shop_id in user metadata. Contact support.');
  }

  return {
    client: supabase,
    shopId,
    user,
  };
}
```

## 👤 Authentication Flow

### Register Shop User

```typescript
// lib/auth.ts
export async function registerShopUser(email: string, password: string, shopId: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        shop_id: shopId,  // Critical: This enables RLS!
      }
    }
  });

  if (error) throw error;
  
  // After registration, shop_id is in JWT custom claims
  // All future queries will be isolated to this shop
  
  return data;
}

// Example usage
const result = await registerShopUser(
  'barber@shop.com',
  'secure_password',
  '550e8400-e29b-41d4-a716-446655440000'  // Existing shop UUID
);
```

### Login with Shop Context

```typescript
export async function loginShopUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  
  // shop_id is automatically in JWT after signup
  // Verify it's present
  const shopId = data.user.user_metadata?.shop_id;
  
  if (!shopId) {
    throw new Error('Account not properly configured. Missing shop_id.');
  }

  console.log(`Logged in as shop: ${shopId}`);
  
  return data;
}
```

## 📊 Data Access (RLS-Protected)

### Appointments

```typescript
// hooks/useAppointments.ts
export function useAppointments(date?: Date) {
  return useQuery({
    queryKey: ['appointments', date],
    queryFn: async () => {
      const { client } = await getShopSupabaseClient();
      
      // RLS filters automatically - only this shop's appointments
      const { data, error } = await client
        .from('appointments')
        .select(`
          *,
          client:clients(name, phone_number, avatar_url),
          employee:employees(name, avatar_url, role),
          service:services(name, duration_minutes, price)
        `)
        .eq('status', 'scheduled')
        .gte('scheduled_at', date?.toISOString())
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      
      return data;
    },
    refetchInterval: 30000, // Refresh every 30s
  });
}

// Component usage
function AppointmentsList() {
  const { data: appointments, isLoading, error } = useAppointments();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!appointments?.length) return <div>No appointments</div>;

  return (
    <div className="appointments-grid">
      {appointments.map((apt) => (
        <AppointmentCard key={apt.id} appointment={apt} />
      ))}
    </div>
  );
}
```

### Clients

```typescript
// hooks/useClients.ts
export function useClients(search?: string) {
  return useQuery({
    queryKey: ['clients', search],
    queryFn: async () => {
      const { client } = await getShopSupabaseClient();
      
      let query = client
        .from('clients')
        .select('*')
        .is('deleted_at', null);  // Exclude soft-deleted

      if (search) {
        query = query.or(`name.ilike.%${search}%,phone_number.ilike.%${search}%`);
      }

      const { data, error } = await query.order('name', { ascending: true });
      
      if (error) throw error;
      
      return data;
    },
  });
}

// Component usage
function ClientsList() {
  const { data: clients } = useClients();
  
  return (
    <ul>
      {clients?.map((client) => (
        <li key={client.id}>
          {client.name} - {client.phone_number}
        </li>
      ))}
    </ul>
  );
}
```

### Employees

```typescript
// hooks/useEmployees.ts
export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { client } = await getShopSupabaseClient();
      
      // RLS filters to active employees of this shop only
      const { data, error } = await client
        .from('employees')
        .select('*')
        .eq('active', true)
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (error) throw error;
      
      return data;
    },
  });
}
```

### Services

```typescript
// hooks/useServices.ts
export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { client } = await getShopSupabaseClient();
      
      const { data, error } = await client
        .from('services')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      
      return data;
    },
  });
}
```

## ➕ Create Operations (RLS-Protected)

### Create Appointment

```typescript
// hooks/useCreateAppointment.ts
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentData: {
      clientId: string;
      employeeId: string;
      serviceId: string;
      scheduledAt: string;
      notes?: string;
    }) => {
      const { client, shopId } = await getShopSupabaseClient();
      
      // Fetch service details
      const { data: service } = await client
        .from('services')
        .select('duration_minutes, price')
        .eq('id', appointmentData.serviceId)
        .single();

      if (!service) throw new Error('Service not found');
      
      // Create appointment - shop_id is automatically matched to token
      const { data, error } = await client
        .from('appointments')
        .insert({
          shop_id: shopId,  // RLS ensures this matches auth user's shop
          client_id: appointmentData.clientId,
          employee_id: appointmentData.employeeId,
          service_id: appointmentData.serviceId,
          scheduled_at: appointmentData.scheduledAt,
          duration_minutes: service.duration_minutes,
          price: service.price,
          notes: appointmentData.notes,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment created successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to create appointment: ${error.message}`);
    },
  });
}

// Component usage
function NewAppointmentForm() {
  const { mutate: createAppointment, isPending } = useCreateAppointment();
  const { data: clients } = useClients();
  const { data: employees } = useEmployees();
  const { data: services } = useServices();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    createAppointment({
      clientId: formData.get('clientId') as string,
      employeeId: formData.get('employeeId') as string,
      serviceId: formData.get('serviceId') as string,
      scheduledAt: formData.get('scheduledAt') as string,
      notes: formData.get('notes') as string,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Create Client

```typescript
// hooks/useCreateClient.ts
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientData: {
      name: string;
      phoneNumber: string;
      email?: string;
      instagram?: string;
      tags?: string[];
    }) => {
      const { client, shopId } = await getShopSupabaseClient();
      
      const { data, error } = await client
        .from('clients')
        .insert({
          shop_id: shopId,  // RLS ensures this matches shop
          name: clientData.name,
          phone_number: clientData.phoneNumber,
          email: clientData.email,
          instagram: clientData.instagram,
          tags: clientData.tags || [],
        })
        .select()
        .single();

      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client added!');
    },
    onError: (error) => {
      toast.error(`Failed to add client: ${error.message}`);
    },
  });
}
```

## ✏️ Update Operations (RLS-Protected)

### Update Appointment

```typescript
// hooks/useUpdateAppointment.ts
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      appointmentId, 
      updates 
    }: { 
      appointmentId: string; 
      updates: Partial<Appointment> 
    }) => {
      const { client } = await getShopSupabaseClient();
      
      const { data, error } = await client
        .from('appointments')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) throw error;
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment updated!');
    },
  });
}

// Cancel appointment (example)
function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const { mutate: updateAppointment } = useUpdateAppointment();

  const handleCancel = () => {
    if (confirm('Cancel this appointment?')) {
      updateAppointment({
        appointmentId,
        updates: { status: 'cancelled' },
      });
    }
  };

  return <button onClick={handleCancel}>Cancel</button>;
}
```

### Soft Delete Client

```typescript
// hooks/useDeleteClient.ts
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { client } = await getShopSupabaseClient();
      
      // Call server-side function for soft delete
      const { data, error } = await client.rpc('soft_delete_client', {
        client_id: clientId,
      });

      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted successfully');
    },
  });
}
```

## 🔄 Real-time Subscriptions

### Listen for Appointment Changes

```typescript
// hooks/useAppointmentsRealtime.ts
export function useAppointmentsRealtime() {
  const { data: appointments, refetch } = useAppointments();

  useEffect(() => {
    // Subscribe to appointment changes for this shop
    const channel = supabase
      .channel('appointments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',  // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'appointments',
          // RLS filters automatically - only this shop's changes
        },
        (payload) => {
          console.log('Appointment changed:', payload);
          refetch();  // Refresh data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return appointments;
}
```

### Listen for Notification Updates

```typescript
// hooks/useNotifications.ts
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { client } = await getShopSupabaseClient();
      
      const { data, error } = await client
        .from('notifications')
        .select('*')
        .is('read_at', null)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setNotifications(data);
      }
    };

    fetchNotifications();

    // Listen for new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          // Show toast notification
          toast.info(payload.new.title);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    const { client } = await getShopSupabaseClient();
    
    await client
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId
          ? { ...n, read_at: new Date().toISOString() }
          : n
      )
    );
  };

  return { notifications, markAsRead };
}
```

## 🛡️ Error Handling

### Common RLS Errors

```typescript
// lib/errors.ts
export class ShopAccessError extends Error {
  constructor() {
    super('Access denied: Cannot access other shop data');
    this.name = 'ShopAccessError';
  }
}

export class NoShopIdError extends Error {
  constructor() {
    super('Authentication error: No shop_id found. Please contact support.');
    this.name = 'NoShopIdError';
  }
}

// Wrap Supabase calls with RLS error handling
export async function withShopCheck<T>(
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // Check if it's an RLS violation
    const message = error instanceof Error ? error.message : String(error);
    
    if (message.includes('row-level security policy')) {
      throw new ShopAccessError();
    }
    
    if (message.includes('No shop_id')) {
      throw new NoShopIdError();
    }
    
    throw error;
  }
}

// Usage
const appointments = await withShopCheck(() =>
  supabase.from('appointments').select('*')
);
```

## 📱 Complete Example: Calendar View

```typescript
// components/ShopCalendar.tsx
export function ShopCalendar() {
  const { data: appointments, isLoading } = useAppointments();
  const { data: employees } = useEmployees();
  const { data: clients } = useClients();
  const { data: services } = useServices();
  
  const { mutate: createAppointment } = useCreateAppointment();

  if (isLoading) return <div className="spinner" />;

  return (
    <div className="shop-calendar">
      <Header shopId={useShopId()} />
      
      <div className="calendar-grid">
        {employees?.map((employee) => (
          <EmployeeColumn
            key={employee.id}
            employee={employee}
            appointments={appointments?.filter(
              apt => apt.employee_id === employee.id
            )}
            clients={clients}
            services={services}
            onCreateAppointment={createAppointment}
          />
        ))}
      </div>
    </div>
  );
}
```

## 🧪 Testing RLS Behavior

### Test Component

```typescript
// components/RLSTest.tsx
export function RLSTest() {
  const { data: appointments } = useAppointments();
  const { data: allAppointments } = useAllAppointments();  // Admin only

  return (
    <div className="rls-test">
      <h3>RLS Security Test</h3>
      
      <div className="test-section">
        <h4>This Shop's Appointments:</h4>
        <pre>{JSON.stringify(appointments, null, 2)}</pre>
        <p>Count: {appointments?.length}</p>
      </div>

      {/* This will be empty for non-admin users */}
      <div className="test-section">
        <h4>All Shops' Appointments (Admin only):</h4>
        <pre>{JSON.stringify(allAppointments, null, 2)}</pre>
        <p>Count: {allAppointments?.length}</p>
      </div>

      <div className="status">
        {appointments?.length ? (
          <p className="success">✓ RLS Working - Isolated to your shop</p>
        ) : (
          <p className="error">✗ RLS Issue - No data accessible</p>
        )}
      </div>
    </div>
  );
}
```

## 🎯 Key Takeaways

1. **Automatic Isolation**: RLS filters automatically - no manual shop_id filtering needed in app code
2. **shop_id in JWT**: Must be set during registration for RLS to work
3. **Views for Convenience**: Use `v_shop_*` views for pre-filtered data
4. **Soft Deletes**: Use RPC functions instead of direct DELETE
5. **Real-time**: Subscriptions respect RLS automatically
6. **Error Handling**: Catch RLS violations and show user-friendly messages
7. **Admin Access**: Admins can set `is_admin` flag to see all shops

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Realtime Guide](https://supabase.com/docs/guides/realtime)
- [NextAuth.js Integration](https://next-auth.js.org/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)

---

**Note:** All queries in this guide are automatically filtered by RLS based on the shop_id in the authenticated user's JWT. No manual filtering needed!
