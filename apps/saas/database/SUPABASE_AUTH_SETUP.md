# Supabase Auth Setup for RLS - BarberZap

## 📋 Overview

This guide explains how to configure Supabase Authentication to include `shop_id` as a custom JWT claim, which is essential for Row Level Security (RLS) to work.

## 🎯 Why Custom JWT Claims?

The Supabase JWT (JSON Web Token) normally includes:
- `sub`: User UUID
- `email`: User email
- `role`: User role (authenticated, anon)
- `aud`: Audience
- `exp`: Expiration time

For multi-tenant RLS, we need to add:
- `shop_id`: The barbershop UUID the user belongs to

This allows the database functions like `current_user_shop_id()` to extract and use this value for filtering.

## 🚀 Step-by-Step Setup

### Method 1: Supabase Dashboard (Simple)

#### 1.1 Create a Shop

First, ensure you have a shop record:

```sql
-- Insert a new shop (if you have a shops table)
INSERT INTO shops (id, name, address, phone)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Barbearia do Zé',
  'Rua Principal, 123',
  '+5511999999999'
);
```

#### 1.2 Register User with shop_id

When registering a user, include `shop_id` in the metadata:

```typescript
// Frontend registration
import { supabase } from '@/lib/supabase';

async function registerShopOwner(
  email: string,
  password: string,
  shopId: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        shop_id: shopId,  // This becomes user_metadata
      }
    }
  });

  if (error) {
    console.error('Registration failed:', error);
    return;
  }

  console.log('User registered with shop_id:', shopId);
  return data;
}

// Usage
await registerShopOwner(
  'owner@shop.com',
  'secure_password_123',
  '550e8400-e29b-41d4-a716-446655440000'
);
```

#### 1.3 Use SQL to Set Custom JWT Claim

After registration, set the custom claim via SQL in Supabase:

```sql
-- This sets shop_id as a custom claim in JWT
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'shop_id', '550e8400-e29b-41d4-a716-446655440000'
)
WHERE email = 'owner@shop.com';

-- Verify
SELECT 
  id,
  email,
  raw_user_meta_data
FROM auth.users
WHERE email = 'owner@shop.com';
```

### Method 2: Database Trigger (Automatic)

#### 2.1 Create a Users-Shops Mapping Table

```sql
-- Table to link users to shops
CREATE TABLE IF NOT EXISTS user_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL,
  role VARCHAR(50) DEFAULT 'owner', -- owner, manager, employee
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, shop_id)
);

CREATE INDEX idx_user_shops_user_id ON user_shops(user_id);
CREATE INDEX idx_user_shops_shop_id ON user_shops(shop_id);
```

#### 2.2 Create Trigger Function to Auto-populate shop_id

```sql
-- Function to auto-set shop_id when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_shop_id UUID;
BEGIN
  -- Extract shop_id from metadata
  v_shop_id := NEW.raw_user_meta_data->>'shop_id';
  
  -- If shop_id provided, create mapping
  IF v_shop_id IS NOT NULL THEN
    INSERT INTO user_shops (user_id, shop_id)
    VALUES (NEW.id, v_shop_id);
    
    -- Confirm by updating user metadata
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_build_object(
      'shop_id', v_shop_id,
      'shop_confirmed', true
    )
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

#### 2.3 Register Shop Owner

```typescript
// Now registration automatically creates user_shops entry
const { data, error } = await supabase.auth.signUp({
  email: 'owner@shop.com',
  password: 'secure_pass',
  options: {
    data: {
      shop_id: '550e8400-e29b-41d4-a716-446655440000',
      full_name: 'João da Barbearia'
    }
  }
});
```

#### 2.4 Create Function to Get shop_id from Database

```sql
-- Function to get shop_id from user_shops table
CREATE OR REPLACE FUNCTION get_user_shop_id(user_id UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT shop_id FROM user_shops 
  WHERE user_id = $1 
  LIMIT 1;
$$;
```

### Method 3: Edge Function (Most Flexible)

#### 3.1 Create Edge Function

Create `supabase/functions/set-shop-claim/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { userId, shopId } = await req.json();
  
  if (!userId || !shopId) {
    return new Response(
      JSON.stringify({ error: 'userId and shopId required' }),
      { status: 400 }
    );
  }

  // Create admin client
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Update user metadata
  const { error } = await supabaseClient.auth.admin.updateUserById(
    userId,
    {
      user_metadata: {
        shop_id: shopId,
      }
    }
  );

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    });
  }

  return new Response(
    JSON.stringify({ success: true, shopId }),
    { status: 200 }
  );
});
```

#### 3.2 Deploy Edge Function

```bash
supabase functions deploy set-shop-claim
```

#### 3.3 Call Edge Function

```typescript
// Frontend: After registration, set shop claim
async function setShopClaim(userId: string, shopId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/set-shop-claim`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, shopId })
    }
  );

  if (!response.ok) {
    throw new Error('Failed to set shop claim');
  }

  return response.json();
}

// After user signup
const { data: { user } } = await supabase.auth.signUp({...});
await setShopClaim(user.id, '550e8400-e29b-41d4-a716-446655440000');
```

## 🔐 Setting Admin Flags

Admin users need special flags to see all shops:

### Method A: Direct Update

```sql
-- Set user as admin
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'shop_id', 'admin-shop-id',
  'is_admin', true,
  'is_superadmin', false
)
WHERE email = 'admin@barberzap.com';
```

### Method B: Edge Function

```typescript
// Edge function to set admin flags
export async function setAdminUser(userId: string isSuperadmin: boolean = false) {
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: {
      is_admin: true,
      is_superadmin: isSuperadmin
    }
  });

  console.log(`User ${userId} set as ${isSuperadmin ? 'super' : ''}admin`);
}
```

## 🧪 Verify Custom Claims Work

### Check Token Payload

```typescript
// Get and inspect JWT
import { supabase } from '@/lib/supabase';

async function checkJWTClaims() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.log('No session');
    return;
  }

  // JWT payload
  console.log('JWT Payload:', session.user);
  console.log('User Metadata:', session.user.user_metadata);
  console.log('shop_id:', session.user.user_metadata?.shop_id);
  
  // You can also decode the raw JWT
  const token = session.access_token;
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Decoded JWT:', payload);
}
```

### Test Database Function

```sql
-- In SQL Editor, test that shop_id is accessible
SET LOCAL app.current_shop_id = '550e8400-e29b-41d4-a716-446655440000';

-- Test current_user_shop_id()
SELECT current_user_shop_id();

-- Should return: 550e8400-e29b-41d4-a716-446655440000
```

## 🔄 Auto-Renewal (Refreshing Tokens)

Token refresh automatically includes custom claims:

```typescript
// Supabase SDK handles this automatically
// Just ensure your middleware correctly extracts shop_id

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed');
    const shopId = session?.user.user_metadata?.shop_id;
    console.log('shop_id still present:', shopId);
  }
});
```

## 📱 Multi-Shop Users (Advanced)

If a user needs access to multiple shops:

### Update user_shops to allow multiple

```sql
-- Drop unique constraint if exists
ALTER TABLE user_shops DROP CONSTRAINT IF EXISTS user_shops_user_id_shop_id_key;

-- OR use a different structure
CREATE TABLE IF NOT EXISTS user_shop_access (
  user_id UUID NOT NULL REFERENCES auth.users(id),
  shop_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL,
  PRIMARY KEY (user_id, shop_id)
);
```

### Switch shops in UI

```typescript
// Get available shops for user
async function getUserShops(userId: string) {
  const { data, error } = await supabase
    .from('user_shops')
    .select('*, shops(*)')
    .eq('user_id', userId);

  return data;
}

// Switch active shop
async function switchShop(shopId: string) {
  // Update app state
  setActiveShop(shopId);
  
  // Trigger refresh to update RLS context
  await refetchQueries();
}
```

## ⚠️ Common Pitfalls

### Issue 1: shop_id not in JWT after signup

**Cause**: Not setting `user_metadata` correctly during signup.

**Fix**:
```typescript
// Correct: Include in options.data
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { shop_id: uuid }  // ✅ Correct
  }
});

// Wrong: Including in body
await supabase.auth.signUp({
  email,
  password,
  user_metadata: { shop_id: uuid }  // ❌ Doesn't work
});
```

### Issue 2: RLS policies not filtering

**Cause**: `set_app_context()` not being called on each request.

**Fix**: Add middleware to extract and set shop_id.

### Issue 3: Admin can't see all shops

**Cause**: `is_admin` flag not set correctly.

**Fix**:
```sql
-- Verify flag is set
SELECT 
  email,
  raw_user_meta_data->>'is_admin' as is_admin
FROM auth.users
WHERE email = 'admin@example.com';

-- Set if missing
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('is_admin', true)
WHERE email = 'admin@example.com';
```

## 📊 Migration Script

```sql
-- Migrate existing users to have shop_id claims
DO $$
DECLARE
  user_record RECORD;
  v_shop_id UUID;
BEGIN
  -- Example: Map users to shops based on email domain
  FOR user_record IN 
    SELECT id, email FROM auth.users
    WHERE raw_user_meta_data->>'shop_id' IS NULL
  LOOP
    -- Extract shop_id from email (simple mapping)
    -- In production, use proper lookup logic
    v_shop_id := (
      SELECT id FROM shops 
      WHERE email_domain = split_part(user_record.email, '@', 2)
      LIMIT 1
    );
    
    IF v_shop_id IS NOT NULL THEN
      UPDATE auth.users
      SET raw_user_meta_data = jsonb_build_object('shop_id', v_shop_id)
      WHERE id = user_record.id;
      
      RAISE NOTICE 'Migrated user % to shop %', 
        user_record.email, v_shop_id;
    END IF;
  END LOOP;
END $$;
```

## 🎯 Best Practices

1. **Set shop_id during signup**: Avoid manual SQL updates
2. **Use Edge Functions**: For secure admin operations
3. **Validate shop_id**: Check it exists in shops table
4. **Log changes**: Track shop_id assignments for audit
5. **Test token refresh**: Ensure claims persist after refresh
6. **Doc for team**: Share this guide with developers

## 🔗 Complete Example Flow

```typescript
// 1. Register new shop owner
const { data: { user } } = await supabase.auth.signUp({
  email: 'owner@newshop.com',
  password: 'secure_pass_123',
  options: {
    data: {
      shop_id: 'new-shop-uuid-here',
      full_name: 'Owner Name',
      role: 'owner'
    }
  }
});

// 2. Trigger automatically sets user_shops entry (if using Method 2)

// 3. User logs in
await supabase.auth.signInWithPassword({
  email: 'owner@newshop.com',
  password: 'secure_pass_123'
});

// 4. shop_id is now in JWT
const session = supabase.auth.getSession();
console.log(session.user.user_metadata.shop_id); // 'new-shop-uuid-here'

// 5. All database queries are filtered to this shop
const { data: appointments } = await supabase
  .from('appointments')
  .select('*');  // RLS filters to shop_id automatically
```

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [JWT Custom Claims Guide](https://supabase.com/docs/guides/auth/server-side/managing-user-data)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [PostgreSQL Search Path](https://www.postgresql.org/docs/current/ddl-schemas.html)

---

**Next Steps**: After configuring auth with custom claims, proceed to implement RLS policies using `07_rls_policies.sql`.
