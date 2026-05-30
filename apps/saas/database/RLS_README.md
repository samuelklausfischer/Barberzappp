# BarberZap - Row Level Security (RLS) Documentation

## 📋 Overview

This document explains how Row Level Security (RLS) works in the BarberZap multi-tenant application to ensure data isolation between different barbershops.

## 🎯 Purpose

- **Multi-tenant isolation**: Each barbershop (shop) can only access its own data
- **Security**: Prevent unauthorized cross-shop data access
- **Compliance**: GDPR/privacy compliance through strict data boundaries
- **Scalability**: Support unlimited shops without security compromises

## 🏗️ Architecture

### Core Components

1. **Helper Functions**
   - `current_user_shop_id()` - Get shop_id from session context
   - `is_admin()` - Check if user is platform admin
   - `is_superadmin()` - Check if user is superadmin
   - `is_jwt_valid()` - Validate authentication

2. **RLS Policies**
   - Applied to all tables with `shop_id` column
   - Enforce isolation at database level (cannot bypass application code)

3. **Context Management**
   - `set_app_context(shop_id)` - Set shop context per session
   - Extracted from JWT custom claims in production

4. **Soft Delete**
   - Functions to mark records as deleted instead of physical deletion
   - Maintain audit trail

## 📊 Database Schema

### Tables with RLS Enabled

| Table | Isolation Method | Notes |
|-------|-----------------|-------|
| `appointments` | shop_id filter | Core business data |
| `clients` | shop_id filter + soft delete | CRM data |
| `employees` | shop_id filter + soft delete | Staff management |
| `working_hours` | shop_id filter | Schedule data |
| `services` | shop_id filter | Service catalog |
| `appointment_reminders` | appointment.shop_id | Linked via appointment |
| `notifications` | shop_id filter | User notifications |
| `audit_logs` | shop_id filter | Audit trail |
| `webhook_logs` | shop_id filter | Integration logs |
| `appointment_outbox` | shop_id filter + worker access | Background jobs |
| `message_outbox` | shop_id filter + worker access | WhatsApp queue |

## 🔐 Security Model

### Access Control Matrix

| Role | Read | Insert | Update | Delete | Cross-Shop Access |
|------|------|--------|--------|--------|-------------------|
| **Shop Member** | Own shop only | Own shop only | Own shop only | Soft delete only | ❌ No |
| **Shop Owner** | Own shop only | Own shop only | Own shop only | Soft delete only | ❌ No |
| **Admin** | All shops | All shops | All shops | All shops | ✅ Yes |
| **Superadmin** | All shops | All shops | All shops | All shops | ✅ Yes |
| **Worker** | All shops | All shops | All shops | All shops | ✅ Yes (for outbox) |

### Policy Types

#### SELECT Policies
```sql
-- Basic pattern for all tables
CREATE POLICY "table_select_shop" ON table_name
  FOR SELECT
  USING (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR 
      shop_id = current_user_shop_id()
    )
  );
```

#### INSERT Policies
```sql
-- Prevent cross-shop data creation
CREATE POLICY "table_insert_shop" ON table_name
  FOR INSERT
  WITH CHECK (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR 
      shop_id = current_user_shop_id()
    ) AND
    shop_id IS NOT NULL  -- Required field
  );
```

#### UPDATE Policies
```sql
-- Prevent cross-shop data modification
CREATE POLICY "table_update_shop" ON table_name
  FOR UPDATE
  USING (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR
      shop_id = current_user_shop_id()
    )
  )
  WITH CHECK (
    is_jwt_valid() AND
    (
      is_admin() OR 
      is_superadmin() OR
      shop_id = current_user_shop_id()
    ) AND
    shop_id = (SELECT shop_id FROM table WHERE id = table.id)
  );
```

#### DELETE Policies
```sql
-- Restrict direct deletes (prefer soft delete)
CREATE POLICY "table_delete_shop" ON table_name
  FOR DELETE
  USING (
    is_jwt_valid() AND
    (is_admin() OR is_superadmin())
  );
```

## 🚀 Setup Instructions

### 1. Supabase Auth Configuration

#### Add Custom JWT Claim

1. Go to Supabase Dashboard → Authentication → Settings
2. Scroll to "JWT Settings" section
3. Add custom claim:

```json
{
  "shop_id": "uuid"
}
```

4. This allows the JWT to carry the shop_id to database

#### Create Auth Trigger (Optional - for automatic mapping)

```sql
-- Trigger to set shop_id when user signs up
CREATE OR REPLACE FUNCTION auto_set_shop_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Assuming shop_id is passed in metadata
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object(
    'shop_id', NEW.raw_user_meta_data->>'shop_id'
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_shop_id();
```

### 2. Backend Configuration

#### Middleware to Set Context

Create a middleware that extracts shop_id and sets database context:

**Node.js/Express Example:**

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setShopContext(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Extract shop_id from custom claims
    const shopId = decoded.app_metadata?.shop_id;
    
    if (!shopId) {
      return res.status(403).json({ error: 'No shop_id in token' });
    }

    // Save to middleware for database queries
    req.shopId = shopId;
    
    // Set database context
    await pool.query('SELECT set_app_context($1)', [shopId]);
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.use(setShopContext);
```

**Python/FastAPI Example:**

```python
from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
import asyncpg

async def set_shop_context(request: Request, db: AsyncSession = Depends(get_db)):
    # Get shop_id from JWT (Supabase)
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided")
    
    token = auth_header.split(" ")[1]
    decoded = supabase_client.auth.get_user(token)
    
    shop_id = decoded.user.user_metadata.get("shop_id")
    
    if not shop_id:
        raise HTTPException(status_code=403, detail="No shop_id in token")
    
    # Set database context
    await db.execute("SELECT set_app_context(:shop_id)", {"shop_id": shop_id})
    
    request.state.shop_id = shop_id
    return shop_id
```

### 3. Frontend Integration

#### Supabase Client Setup

```typescript
// Initialize Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to get authenticated client with shop context
export async function getAuthenticatedShopClient() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  const shopId = user.user_metadata?.shop_id;
  
  if (!shopId) {
    throw new Error('No shop_id in user metadata');
  }

  return { supabase, shopId, user };
}
```

#### Using the Client

```typescript
// Example: Fetch shop's appointments
async function fetchShopAppointments() {
  const { supabase, shopId } = await getAuthenticatedShopClient();
  
  // RLS filters automatically - only shop's appointments
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      client:clients(name, phone_number),
      employee:employees(name),
      service:services(name, price)
    `)
    .order('scheduled_at', { ascending: true });
    
  if (error) throw error;
  
  return data;
}

// Example: Create new appointment
async function createAppointment(appointmentData: any) {
  const { supabase, shopId } = await getAuthenticatedShopClient();
  
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      ...appointmentData,
      shop_id: shopId,  // RLS ensures this matches auth user's shop
    })
    .select();
    
  if (error) throw error;
  
  return data;
}
```

## 🧪 Testing

### Running Tests

```bash
# Connect to Supabase
psql $DATABASE_URL

# Run RLS tests
\i /root/barber/database/08_rls_tests.sql
```

### Manual Testing

```sql
-- Test: Create client as Shop A
SELECT set_app_context('shop-a-uuid-here');

INSERT INTO clients (shop_id, name, phone_number)
VALUES ('shop-a-uuid-here', 'Test Client', '+5511999999999');

-- Should succeed

-- Test: Try to create client for Shop B
INSERT INTO clients (shop_id, name, phone_number)
VALUES ('shop-b-uuid-here', 'Hacker', '+5511888888888');

-- Should FAIL: new row violates row-level security policy
```

## 🔍 Monitoring

### Check RLS Status

```sql
-- View all tables with RLS enabled
SELECT * FROM v_rls_status;

-- View all policies
SELECT * FROM v_rls_policies;
```

### Audit Queries

```sql
-- Check for potential RLS violations
SELECT 
  shop_id,
  COUNT(*) as total_records
FROM appointments
GROUP BY shop_id;

-- Verify isolation per shop
SELECT 
  (SELECT COUNT(*) FROM clients WHERE shop_id = current_user_shop_id()) as my_clients,
  (SELECT COUNT(*) FROM clients) as total_all_clients;
```

## ⚠️ Common Issues

### Issue 1: "No shop_id in token"

**Solution:** Ensure user metadata includes shop_id after registration:

```typescript
// On registration
const { data, error } = await supabase.auth.signUp({
  email: 'shop@example.com',
  password: 'secret',
  options: {
    data: {
      shop_id: 'your-shop-uuid'
    }
  }
});
```

### Issue 2: RLS blocking legitimate access

**Solution:** Verify context is set:

```sql
-- Check current context
SELECT current_setting('app.current_shop_id', true);

-- If NULL, middleware not working
SELECT set_app_context('your-shop-uuid');
```

### Issue 3: Worker can't access outbox

**Solution:** Ensure is_jwt_valid() returns true for worker:

```sql
-- Worker should have valid JWT
-- Or use service role key bypasses RLS completely
```

## 📚 Best Practices

### 1. Always Use RLS Views

```sql
-- Use views instead of direct table access
CREATE VIEW v_shop_appointments AS
SELECT * FROM appointments
WHERE shop_id = current_user_shop_id();

-- Frontend queries view
supabase.from('v_shop_appointments').select('*');
```

### 2. Prefer Soft Deletes

```sql
-- Bad: DELETE
DELETE FROM clients WHERE id = $1;

-- Good: Soft delete
SELECT soft_delete_client($1);
```

### 3. Validate shop_id in Application Layer

```typescript
// Backend validation
if (data.shop_id !== user.shop_id) {
  throw new ForbiddenError('Cannot access other shop data');
}
```

### 4. Log Access Attempts

```sql
-- Create audit trigger
CREATE OR REPLACE FUNCTION log_rls_violation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (shop_id, table_name, record_id, action, old_data, new_data)
  VALUES (
    current_user_shop_id(),
    TG_TABLE_NAME,
    NEW.id,
    TG_OP,
    row_to_json(OLD)::jsonb,
    row_to_json(NEW)::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 🎓 Advanced Topics

### Row Security Based on Employee Role

```sql
-- Employees only see their own appointments
CREATE POLICY "appointments_select_own" ON appointments
  FOR SELECT
  USING (
    employee_id = current_user_id() OR
    is_admin() OR
    is_superadmin()
  );
```

### Time-Based Data Access

```sql
-- Restrict access based on scheduled time
CREATE POLICY "appointments_select_future_only" ON appointments
  FOR SELECT
  USING (
    scheduled_at >= NOW() - INTERVAL '1 day' OR
    is_admin() OR
    is_superadmin()
  );
```

## 📞 Support & Troubleshooting

### Quick Debug Checklist

- [ ] JWT includes shop_id custom claim
- [ ] `set_app_context()` is called on each request
- [ ] RLS is enabled on all tables
- [ ] Policy exists for each operation (SELECT/INSERT/UPDATE/DELETE)
- [ ] `is_jwt_valid()` returns true for authenticated users
- [ ] Frontend passes Authorization header
- [ ] Backend extracts and sets shop_id correctly

### Get Help

1. Check Supabase RLS documentation
2. Review test results in `08_rls_tests.sql`
3. Enable query logging to see blocked queries
4. Use `pg_policies` view to see all active policies

## 📝 Migration Checklist

- [ ] Create helper functions
- [ ] Enable RLS on all tables
- [ ] Create policies for each table
- [ ] Create soft delete functions
- [ ] Create RLS views
- [ ] Configure Supabase Auth with custom claims
- [ ] Implement middleware to set context
- [ ] Update frontend to use shop_id
- [ ] Run security tests
- [ ] Monitor for violations
- [ ] Document for team

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-04 | Initial RLS implementation |

---

**Note:** This RLS implementation is critical for production security. Always test thoroughly in staging environment before deploying to production.
