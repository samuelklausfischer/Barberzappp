# 🔒 BarberZap RLS - Quick Start Guide

## 📋 Prerequisites Checklist

- [ ] Supabase project created
- [ ] Database tables migrated (`01_critical_tables.sql`, `02_*.sql`, etc.)
- [ ] Supabase CLI installed
- [ ] Node.js/Python backend environment ready

## ⚡ 10-Minute Setup

### Step 1: Apply RLS Policies (2 minutes)

```bash
# Connect to Supabase
psql $DATABASE_URL

# Or use Supabase Dashboard > SQL Editor
```

```sql
-- Run the RLS policies
\i /root/barber/database/07_rls_policies.sql;

-- Verify RLS is enabled
SELECT * FROM v_rls_status;
```

**Expected output**: All tables show `ENABLED` status.

---

### Step 2: Register First Shop User (3 minutes)

#### Option A: Using Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Email: `owner@shop1.com`
4. Password: `DevPass123!` (enable Auto-confirm for testing)
5. Click **Add user**
6. Click **View** on the new user
7. In **User Metadata**, add:
   ```json
   {
     "shop_id": "SHOP1-UUID-HERE"
   }
   ```

#### Option B: Using SQL

```sql
-- Create a test shop
INSERT INTO shops (id, name, address, phone)
VALUES (
  gen_random_uuid(),
  'Test Shop 1',
  'Rua Teste, 123',
  '+5511999999001'
) RETURNING id;

-- Copy the returned ID, then:

-- Register user with shop_id
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'shop_id', 'PASTE_SHOP_ID_HERE',
  'full_name', 'Shop Owner'
)
WHERE email = 'owner@shop1.com';

-- Verify
SELECT email, raw_user_meta_data
FROM auth.users
WHERE email = 'owner@shop1.com';
```

#### Option C: Using Frontend (Recommended)

```typescript
import { supabase } from '@/lib/supabase';

async function createShopAndOwner() {
  // Step 1: Create shop
  const { data: shop } = await supabase
    .from('shops')
    .insert({ name: 'Shop 1', address: '...', phone: '...' })
    .select()
    .single();

  const shopId = shop.id;

  // Step 2: Register owner with shop_id
  const { data, error } = await supabase.auth.signUp({
    email: 'owner@shop1.com',
    password: 'DevPass123!',
    options: {
      data: {
        shop_id: shopId,
        full_name: 'Owner Name'
      }
    }
  });

  console.log('Shop created:', shopId);
  console.log('User registered:', data);

  return { shop, user: data.user };
}

createShopAndOwner();
```

---

### Step 3: Configure Backend Middleware (3 minutes)

#### Node.js/Express

```bash
npm install pg jsonwebtoken
```

```javascript
// middleware/rls.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setShopContext(req, res, next) {
  // Skip RLS for service role (admin tasks)
  if (req.headers.authorization === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return next();
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Decode JWT (Supabase SDK handles this)
    const { user, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const shopId = user.user_metadata?.shop_id;
    
    if (!shopId) {
      return res.status(403).json({ 
        error: 'No shop_id in user metadata. Contact support.' 
      });
    }

    // Set database context for RLS
    await pool.query('SELECT set_app_context($1)', [shopId]);
    
    // Attach to request for later use
    req.shopId = shopId;
    req.user = user;
    
    next();
  } catch (error) {
    console.error('RLS middleware error:', error);
    return res.status(500).json({ error: 'Context error' });
  }
}

// Apply to all routes
app.use(setShopContext);

// Or specific routes
app.get('/api/appointments', setShopContext, getAppointments);
```

#### Python/FastAPI

```python
# middleware/rls.py
from fastapi import Depends, HTTPException, Request
import asyncpg

async def set_shop_context(request: Request):
    # Skip for service role
    if request.headers.get("Authorization") == f"Bearer {os.getenv('SUPABASE_SERVICE_ROLE_KEY')}":
        return None
    
    # Get user from Supabase
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = supabase.auth.get_user(token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    shop_id = user.user.user_metadata.get("shop_id")
    
    if not shop_id:
        raise HTTPException(status_code=403, detail="No shop_id configured")
    
    # Set database context (requires connection)
    await request.state.db.execute("SELECT set_app_context($1)", [shop_id])
    
    request.state.shop_id = shop_id
    request.state.user = user.user
    return shop_id

# Usage in routes
@app.get("/api/appointments")
async def get_appointments(shop_id: str = Depends(set_shop_context)):
    # shop_id is already set, RLS will filter automatically
    result = await request.state.db.fetch("SELECT * FROM v_shop_appointments")
    return result
```

---

### Step 4: Update Frontend (2 minutes)

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper to verify shop context
export async function verifyShopContext() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('❌ Not authenticated');
    return null;
  }

  const shopId = user.user_metadata?.shop_id;
  
  if (!shopId) {
    console.error('❌ No shop_id in user metadata');
    return null;
  }

  console.log('✅ Shop context:', shopId);
  return { supabase, shopId, user };
}
```

---

## ✅ Verify RLS Works

### Test 1: Manual Test in SQL

```sql
-- Set shop A context
SELECT set_app_context('SHOP1-UUID-HERE');

-- Should only see shop A's data
SELECT COUNT(*) FROM clients;  -- = N (shop A's clients)

-- Set shop B context
SELECT set_app_context('SHOP2-UUID-HERE');

-- Should only see shop B's data
SELECT COUNT(*) FROM clients;  -- = M (shop B's clients)
```

### Test 2: Frontend Verification

```typescript
// Run this in browser console or in a component
async function testRLS() {
  const { supabase, shopId } = await verifyShopContext();
  
  // Get all appointments (RLS filters to this shop)
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('*, clients(name)');
  
  if (error) {
    console.error('❌ RLS Error:', error);
    return;
  }
  
  console.log(`✅ Shop ${shopId} has ${appointments.length} appointments`);
  console.table(appointments);
  
  // Try to access appointment from another shop (should fail or return empty)
  const otherShopAppointment = await supabase
    .from('appointments')
    .select('*')
    .eq('shop_id', 'OTHER-SHOP-UUID');
  
  console.log('Other shop appointments:', otherShopAppointment.data);
  console.log('Expected: [] (empty array)');
}

testRLS();
```

### Test 3: Automated Tests

```bash
# Run the test suite
psql $DATABASE_URL -f /root/barber/database/08_rls_tests.sql

# Expected: All tests show ✓ PASSOU
```

---

## 🧪 Common Scenarios

### Scenario 1: Shop Owner Dashboard

```typescript
function ShopDashboard() {
  const { data: appointments } = useAppointments();  // Auto-filtered
  const { data: clients } = useClients();  // Auto-filtered
  const { data: employees } = useEmployees();  // Auto-filtered
  
  return (
    <div>
      <h1>Welcome to Your Shop</h1>
      <Stats appointments={appointments} clients={clients} />
      <AppointmentList appointments={appointments} />
    </div>
  );
}
```

### Scenario 2: Admin Dashboard (All Shops)

```typescript
function AdminDashboard() {
  const { data: appointments } = useAllAppointments();  // No filtering
  
  return (
    <div>
      <h1>Platform Overview</h1>
      <h2>All Shops: {appointments.length} Total Appointments</h2>
      <AllShopStats appointments={appointments} />
    </div>
  );
}

// Admin hook
function useAllAppointments() {
  return useQuery({
    queryKey: ['admin', 'appointments'],
    queryFn: async () => {
      // Use service role key or set is_admin flag
      const supabaseAdmin = createClient(
        url,
        service_role_key
      );
      
      const { data } = await supabaseAdmin
        .from('appointments')
        .select('*, shops(name)');
      
      return data;
    }
  });
}
```

### Scenario 3: Cross-Shop Data Access (Should Fail)

```typescript
// This should return empty or error
async function tryCrossShopAccess() {
  const { supabase } = await verifyShopContext();
  const myShopId = (await supabase.auth.getUser()).data.user.user_metadata.shop_id;
  
  // Try to insert appointment for different shop
  const { error } = await supabase
    .from('appointments')
    .insert({
      shop_id: 'DIFFERENT-SHOP-UUID',  // ❌ Violates RLS
      client_id: '...',
      employee_id: '...',
      service_id: '...',
      scheduled_at: new Date().toISOString(),
      duration_minutes: 30,
      price: 50
    });
  
  if (error) {
    console.log('✅ RLS blocked cross-shop insert:', error.message);
    // Error: "new row violates row-level security policy"
  }
}
```

---

## 🐛 Troubleshooting

### Problem: "No shop_id in user metadata"

**Check**:
```sql
SELECT email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'your@email.com';
```

**Fix**: Set it manually or re-register with proper metadata.

---

### Problem: RLS not filtering (seeing all data)

**Check**:
```sql
SELECT * FROM v_rls_status;
```

**Fix**: Ensure RLS is enabled on tables.

---

### Problem: Middleware not setting context

**Symptom**: `SELECT current_user_shop_id()` returns `NULL`

**Fix**:
```typescript
// Add debug logging
console.log('Setting shop context:', shopId);
const result = await pool.query('SELECT set_app_context($1) RETURNING current_user_shop_id()', [shopId]);
console.log('Context set to:', result.rows[0].current_user_shop_id);
```

---

### Problem: Token refresh loses shop_id

**Symptom**: After token refresh, RLS blocks access

**Fix**: Custom claims persist through token refresh automatically. If still lost, check if edge functions override metadata.

---

## 📋 Implementation Checklist

- [ ] Apply `07_rls_policies.sql`
- [ ] Configure Supabase Auth with custom claims
- [ ] Implement backend middleware for `set_app_context()`
- [ ] Update backend code to use views (`v_shop_*`)
- [ ] Update frontend to verify shop context
- [ ] Run test suite `08_rls_tests.sql`
- [ ] Test with multiple shops simultaneously
- [ ] Deploy to staging environment
- [ ] Load test for performance impact

---

## 🚀 Production Deployment

### 1. Staging Checklist

```bash
# Run full test suite
psql $STAGING_DB -f database/08_rls_tests.sql

# Verify all shops isolated
```

### 2. Monitoring

```sql
-- Create notification for RLS violations (optional)
-- See documentation for setup details
```

### 3. Performance Considerations

- RLS adds minimal overhead (~1-3% query time)
- Use indexes on `shop_id` columns
- Consider caching shop metadata
- Measure query costs with `EXPLAIN ANALYZE`

---

## 📚 Next Steps

1. **Read full documentation**: `RLS_README.md`
2. **Frontend examples**: `FRONTEND_EXAMPLE.md`
3. **Auth setup guide**: `SUPABASE_AUTH_SETUP.md`
4. **Run security tests**: `database/08_rls_tests.sql`

---

## 💡 Quick Reference

### Key Functions

```sql
-- Set shop context
SELECT set_app_context('shop-uuid');

-- Get current shop
SELECT current_user_shop_id();

-- Check if admin
SELECT is_admin();

-- Soft delete
SELECT soft_delete_client('client-uuid');

-- Restore
SELECT restore_client('client-uuid');
```

### Commands

```bash
# Apply RLS
psql $DATABASE_URL -f database/07_rls_policies.sql

# Run tests
psql $DATABASE_URL -f database/08_rls_tests.sql

# Check status
psql $DATABASE_URL -c "SELECT * FROM v_rls_status;"
```

---

**Done! RLS is now active and your multi-tenant BarberZap application is secure.** 🎉

**Questions?** See `RLS_README.md` for detailed explanations.
