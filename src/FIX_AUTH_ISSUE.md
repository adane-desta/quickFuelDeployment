# 🚨 FIX: 401 Unauthorized - Authentication Disabled

## The Error

```
POST https://djfzgxnquxzbnxfjvkcp.supabase.co/auth/v1/token?grant_type=password 401 (Unauthorized)
POST https://djfzgxnquxzbnxfjvkcp.supabase.co/auth/v1/signup 401 (Unauthorized)
```

## Root Cause

Your Supabase project has **Email Auth disabled** or authentication settings are not properly configured.

## Fix (3 Steps - 5 Minutes)

### Step 1: Enable Email Authentication in Supabase

1. Go to: https://djfzgxnquxzbnxfjvkcp.supabase.co
2. Click **"Authentication"** in the left sidebar
3. Click **"Providers"** tab
4. Find **"Email"** provider
5. Make sure it's **ENABLED** (toggle should be ON/green)
6. **IMPORTANT**: Scroll down and find these settings:

#### Enable Email Provider Settings:
- ✅ **Enable Email Provider**: ON
- ✅ **Confirm Email**: OFF (turn this OFF for development)
- ✅ **Secure Email Change**: OFF (turn this OFF for development)

7. Click **"Save"**

### Step 2: Disable Email Confirmations (For Development)

1. Still in **Authentication → Providers → Email**
2. Find **"Confirm email"** setting
3. **Turn it OFF** (very important!)
4. Find **"Double Confirm Email Change"**
5. **Turn it OFF** too
6. Click **"Save"**

### Step 3: Check Site URL Settings

1. In **Authentication**, click **"URL Configuration"**
2. Make sure **Site URL** includes:
   - `http://localhost:5173`
   - `http://localhost:3000` (if you use this)
3. Add both to **Redirect URLs** list:
   - `http://localhost:5173/**`
   - `http://localhost:3000/**`
4. Click **"Save"**

### Step 4: Get Your CORRECT Anon Key

1. Go to **Settings** → **API**
2. Find **Project URL**: Should be `https://djfzgxnquxzbnxfjvkcp.supabase.co`
3. Find **anon** / **public** key: Copy the FULL key (it's very long!)
4. Create `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=https://djfzgxnquxzbnxfjvkcp.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_FULL_ANON_KEY_HERE
```

5. **RESTART YOUR DEV SERVER** (very important!)

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Step 5: Update Admin User to Skip Email Confirmation

Run this SQL in Supabase SQL Editor:

```sql
-- First, delete any existing admin user (to start fresh)
DELETE FROM users WHERE email = 'admin@quickfuel.com';
DELETE FROM auth.users WHERE email = 'admin@quickfuel.com';

-- Create admin user with email already confirmed
DO $$
DECLARE
  admin_uuid UUID;
BEGIN
  -- Create auth user with email confirmed
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,  -- THIS IS KEY! 
    confirmation_token,
    recovery_token,
    email_change_token_new,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmed_at  -- THIS TOO!
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@quickfuel.com',
    crypt('Admin123!', gen_salt('bf')),
    NOW(),  -- Email confirmed NOW
    '',
    '',
    '',
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    NOW()  -- Confirmed NOW
  ) RETURNING id INTO admin_uuid;

  -- Create user profile
  INSERT INTO users (
    id,
    email,
    full_name,
    phone,
    role,
    is_active,
    employee_id,
    department
  ) VALUES (
    admin_uuid,
    'admin@quickfuel.com',
    'System Administrator',
    '+251911000000',
    'admin',
    true,
    'EMP001',
    'System Administration'
  );

  RAISE NOTICE 'Admin user created with ID: %', admin_uuid;
END $$;

-- Verify it was created correctly
SELECT 
  id, 
  email, 
  email_confirmed_at, 
  confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'admin@quickfuel.com';
```

### Step 6: Test

1. Refresh browser (Ctrl+R)
2. Go to login page
3. Enter:
   - Email: `admin@quickfuel.com`
   - Password: `Admin123!`
4. Click Sign In
5. ✅ Should work now!

## Common Issues & Solutions

### Issue 1: Still Getting 401

**Check:** Is email auth enabled?
```
Authentication → Providers → Email → Make sure toggle is GREEN/ON
```

**Check:** Is email confirmation disabled?
```
Authentication → Providers → Email → "Confirm email" should be OFF
```

### Issue 2: "Invalid login credentials"

**Check:** Does user exist and is email confirmed?
```sql
SELECT email, email_confirmed_at FROM auth.users WHERE email = 'admin@quickfuel.com';
```

If `email_confirmed_at` is NULL, run:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW(), confirmed_at = NOW() 
WHERE email = 'admin@quickfuel.com';
```

### Issue 3: "Email not confirmed"

Run this SQL:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW(), confirmed_at = NOW() 
WHERE email IS NOT NULL;
```

### Issue 4: Anon Key Invalid

1. Go to Supabase → Settings → API
2. Copy the FULL anon key (should be ~200+ characters)
3. Update `.env.local`
4. **RESTART dev server**

## Verification Checklist

- [ ] Email auth provider is ENABLED ✅
- [ ] "Confirm email" is OFF ✅
- [ ] "Double confirm email change" is OFF ✅
- [ ] Site URL includes localhost:5173 ✅
- [ ] Redirect URLs includes localhost:5173/** ✅
- [ ] .env.local has correct VITE_SUPABASE_URL ✅
- [ ] .env.local has FULL VITE_SUPABASE_ANON_KEY ✅
- [ ] Dev server was RESTARTED after .env changes ✅
- [ ] Admin user exists in auth.users ✅
- [ ] Admin user email_confirmed_at is NOT NULL ✅
- [ ] Admin user exists in users table ✅
- [ ] Browser cache was cleared ✅

## Test Registration (As Driver)

After fixing admin login, test driver registration:

1. Logout
2. Go to landing page
3. Click "Get Started"
4. Fill registration form
5. Should create account WITHOUT email confirmation
6. Should auto-login

If registration fails with 401:
- Double-check email auth is enabled
- Double-check "Confirm email" is OFF
- Check browser console for specific error

## Production Note

When deploying to production:
1. **Turn ON email confirmation**
2. **Set up email templates** in Supabase
3. **Configure SMTP** (or use Supabase's email service)
4. **Update redirect URLs** to your production domain

For development, email confirmation should be OFF!

## Final Test

```bash
# 1. Stop server
Ctrl+C

# 2. Clear cache
rm -rf .vite

# 3. Start fresh
npm run dev

# 4. Open in incognito window
http://localhost:5173/login

# 5. Login
admin@quickfuel.com / Admin123!

# 6. Should work! ✅
```

## Still Not Working?

Share these details:
1. Screenshot of Authentication → Providers → Email settings
2. Output of this SQL:
```sql
SELECT email, email_confirmed_at, confirmed_at FROM auth.users WHERE email = 'admin@quickfuel.com';
```
3. First 50 characters of your anon key from .env.local
4. Any errors in browser console

---

**This should fix the 401 Unauthorized error!** 🎉
