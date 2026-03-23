# 🚀 START HERE - QuickFuel Setup Guide

## Current Error: 401 Unauthorized

You're getting this error because **Email Authentication is disabled** in your Supabase project.

## Quick Fix (5 Minutes)

### Step 1: Enable Email Auth in Supabase ⚡️

1. **Open Supabase Dashboard**
   - Go to: https://djfzgxnquxzbnxfjvkcp.supabase.co
   - Login to your account

2. **Go to Authentication Settings**
   - Click **"Authentication"** in left sidebar
   - Click **"Providers"** tab

3. **Enable Email Provider**
   - Find **"Email"** in the list
   - Make sure the toggle is **ON** (green)
   - Click the **"Email"** row to open settings

4. **Disable Email Confirmation** (Important!)
   - Find **"Confirm email"** setting
   - Turn it **OFF** (should be unchecked/disabled)
   - Find **"Secure email change enabled"**
   - Turn it **OFF** too
   - Click **"Save"**

5. **Configure Redirect URLs**
   - Still in Authentication, click **"URL Configuration"**
   - Add these URLs:
     - Site URL: `http://localhost:5173`
     - Redirect URLs: `http://localhost:5173/**`
   - Click **"Save"**

### Step 2: Create Admin User 🔐

1. **Open SQL Editor**
   - In Supabase, click **"SQL Editor"** in left sidebar
   - Click **"New query"**

2. **Copy and Run This SQL**

```sql
-- Delete any existing admin (to start fresh)
DELETE FROM users WHERE email = 'admin@quickfuel.com';
DELETE FROM auth.users WHERE email = 'admin@quickfuel.com';

-- Create admin user
DO $$
DECLARE
  admin_uuid UUID;
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    confirmation_token,
    recovery_token,
    email_change_token_new
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@quickfuel.com',
    crypt('Admin123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    '',
    '',
    ''
  ) RETURNING id INTO admin_uuid;

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

  RAISE NOTICE 'Admin created: %', admin_uuid;
END $$;

-- Initialize fuel prices
INSERT INTO fuel_prices (fuel_type, price_per_liter, effective_from, updated_by, updated_at)
VALUES 
  ('Petrol', 65.00, CURRENT_DATE, 'System', NOW()),
  ('Diesel', 58.00, CURRENT_DATE, 'System', NOW())
ON CONFLICT (fuel_type) DO UPDATE SET
  price_per_liter = EXCLUDED.price_per_liter,
  updated_at = NOW();
```

3. **Click "Run"** (or press Ctrl+Enter)
4. **Verify Success** - Should see "Admin created: [some-uuid]"

### Step 3: Fix RLS Policies 🛡️

Still in SQL Editor, run this:

```sql
-- Fix users table policies (remove recursion)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
CREATE POLICY "users_select_own" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_insert_during_signup" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
```

### Step 4: Start the App 🚀

```bash
# Install dependencies (if you haven't)
npm install

# Start development server
npm run dev
```

### Step 5: Login ✅

1. Open: http://localhost:5173
2. Click **"Sign In"**
3. Enter:
   - Email: `admin@quickfuel.com`
   - Password: `Admin123!`
4. Click **"Sign In"**
5. **✅ You're in!**

---

## Common Issues & Quick Fixes

### Issue 1: Still Getting 401 Error

**Check Email Auth is ON:**
- Supabase → Authentication → Providers → Email
- Toggle should be GREEN/ON
- "Confirm email" should be OFF

**Verify Admin User:**
```sql
SELECT email, email_confirmed_at FROM auth.users WHERE email = 'admin@quickfuel.com';
```
Should return 1 row with email_confirmed_at NOT NULL

### Issue 2: "Email not confirmed"

Run this SQL:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW(), confirmed_at = NOW() 
WHERE email = 'admin@quickfuel.com';
```

### Issue 3: "Invalid login credentials"

**Reset Password:**
```sql
UPDATE auth.users 
SET encrypted_password = crypt('Admin123!', gen_salt('bf'))
WHERE email = 'admin@quickfuel.com';
```

### Issue 4: Anon Key Issues

1. Go to: Supabase → Settings → API
2. Copy the **full** anon/public key (very long!)
3. Update `.env.local`:
```env
VITE_SUPABASE_URL=https://djfzgxnquxzbnxfjvkcp.supabase.co
VITE_SUPABASE_ANON_KEY=paste_full_key_here
```
4. **Restart dev server** (Ctrl+C then npm run dev)

---

## Verification Checklist

Before trying to login, verify:

- [ ] Supabase Email provider is ENABLED
- [ ] "Confirm email" is OFF
- [ ] Site URL is set to localhost:5173
- [ ] Admin user exists in auth.users table
- [ ] Admin user email_confirmed_at is NOT NULL
- [ ] Admin user exists in users table
- [ ] RLS policies are fixed
- [ ] .env.local has correct credentials
- [ ] Dev server is running
- [ ] Browser cache is cleared

---

## Success! What's Next?

Once logged in as admin, you can:

### 1. Add Fuel Stations
- Go to **"Stations"** tab
- Click **"Add Station"** button
- Fill in station details (name, address, phone, location)
- Fill in operator details (name, email, phone, license)
- System creates operator account automatically
- Check console for operator password

### 2. Manage Fuel Prices
- Go to **"Fuel Prices"** tab
- Click **"Edit"** on any fuel type
- Set new price and effective date
- Click **"Save Changes"**

### 3. View Analytics
- Go to **"Analytics"** tab
- See total fuel available
- Track dispensing by station
- View revenue metrics

### 4. Register as Driver (Test)
- Logout (top right corner)
- Go to landing page
- Click **"Get Started"**
- Fill 2-step registration form
- Login and explore driver portal

---

## Complete Documentation

- **FIX_AUTH_ISSUE.md** - Detailed auth fix guide
- **FIX_RLS_POLICIES.sql** - Complete RLS policy fix
- **SYSTEM_COMPLETE.md** - Full system documentation
- **README.md** - Project overview

---

## Need Help?

### Check These First:
1. Browser console errors (F12)
2. Supabase logs (Logs → API)
3. Verify email auth is enabled
4. Verify admin user exists
5. Try incognito mode

### Still Stuck?
Share:
1. Screenshot of Authentication → Providers → Email
2. Output of: `SELECT * FROM auth.users WHERE email = 'admin@quickfuel.com'`
3. Browser console errors
4. Supabase logs

---

## Important Notes

### For Development:
- Email confirmation: **OFF** ✅
- Email allows: All domains ✅
- Password requirements: Default ✅

### For Production (Later):
- Email confirmation: **ON**
- Configure SMTP or use Supabase email
- Set up email templates
- Update redirect URLs to production domain
- Enable 2FA for admins
- Set up monitoring

---

## Quick Test

After setup, test this flow:

1. ✅ Admin login works
2. ✅ Add a station (creates operator)
3. ✅ Update fuel prices
4. ✅ View analytics
5. ✅ Logout and register as driver
6. ✅ Driver can see stations
7. ✅ Driver can make reservation

If all work, you're 100% ready! 🎉

---

**Start with Step 1 above and you'll be running in 5 minutes!** 🚀
