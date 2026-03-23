# 🚨 FIXING YOUR 401 UNAUTHORIZED ERRORS

## 🔍 Problem Analysis

Based on your error logs, you're experiencing:

```
POST https://djfzgxnquxzbnxfjvkcp.supabase.co/auth/v1/token?grant_type=password 401 (Unauthorized)
POST https://djfzgxnquxzbnxfjvkcp.supabase.co/auth/v1/signup 401 (Unauthorized)
```

**Root Causes**:
1. ❌ **Wrong Supabase URL**: You're using `djfzgxnquxzbnxfjvkcp` (old project) but config shows `nylwaavkajrkwwmrkjqg` (new project)
2. ❌ **Database tables don't exist yet**: The SQL scripts haven't been run
3. ❌ **Email confirmation enabled**: Blocking authentication
4. ❌ **RLS policies missing**: Even if auth works, data won't load

---

## ✅ COMPLETE FIX (Follow These Steps EXACTLY)

### **Step 1: Clear Everything and Start Fresh**

#### 1.1 Clear Browser Cache
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Clear site data**
4. Close and reopen browser

#### 1.2 Identify Your ACTUAL Supabase Project
Go to https://supabase.com/dashboard and find your project.

**Which project are you using?**
- Old: `djfzgxnquxzbnxfjvkcp` (shows in errors)
- New: `nylwaavkajrkwwmrkjqg` (shows in config)

**CHOOSE ONE** and stick with it. We'll use the NEW one.

---

### **Step 2: Configure Supabase Project**

#### 2.1 Get Your Credentials
1. Go to https://supabase.com/dashboard
2. Select project: `nylwaavkajrkwwmrkjqg`
3. Go to **Settings** → **API**
4. Copy these values:

```
Project URL: https://nylwaavkajrkwwmrkjqg.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55bHdhYXZrYWpya3d3bXJranFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MzgyMzEsImV4cCI6MjA4OTAxNDIzMX0.KUgZqnK3oxWG7G4EX6sfZEuj2qAOII_z6REs8dGCxIg
```

#### 2.2 Disable Email Confirmation (Critical!)
1. Go to **Authentication** → **Settings**
2. Scroll to **Email** section
3. Find **"Confirm email"** toggle
4. **TURN IT OFF** (for development)
5. Click **Save**

**⚠️ THIS IS THE MOST COMMON ISSUE!**

#### 2.3 Add Redirect URLs
1. Go to **Authentication** → **URL Configuration**
2. Add these URLs to **Redirect URLs**:
```
http://localhost:3000
http://localhost:3000/login
http://localhost:3000/admin
http://localhost:3000/driver
http://localhost:3000/operator
```
3. Set **Site URL** to: `http://localhost:3000`
4. Click **Save**

---

### **Step 3: Run Database Setup Scripts**

Go to **SQL Editor** in Supabase Dashboard.

#### 3.1 Create Database Schema
Create a new query and paste **entire contents** of `/DATABASE_SCHEMA_COMPLETE.sql`

Click **Run**.

**Expected Output**: "Success. No rows returned"

#### 3.2 Apply Security Policies
Create a new query and paste **entire contents** of `/DATABASE_RLS_POLICIES.sql`

Click **Run**.

**Expected Output**: "Success. No rows returned"

#### 3.3 Insert Initial Data
Create a new query and paste **entire contents** of `/DATABASE_INITIAL_DATA.sql`

Click **Run**.

**Expected Output**: 
```
✅ Admin user created successfully!
   Email: admin@quickfuel.com
   Password: Admin123!
```

#### 3.4 Verify Setup
Run this verification query:

```sql
-- VERIFICATION QUERY
SELECT 
  'auth.users' as table_name, 
  COUNT(*)::text as count 
FROM auth.users
UNION ALL
SELECT 'users', COUNT(*)::text FROM users
UNION ALL
SELECT 'stations', COUNT(*)::text FROM stations
UNION ALL
SELECT 'fuel_prices', COUNT(*)::text FROM fuel_prices
UNION ALL
SELECT 'reservations', COUNT(*)::text FROM reservations
UNION ALL
SELECT 'notifications', COUNT(*)::text FROM notifications
UNION ALL
SELECT 'RLS Policies', COUNT(*)::text 
FROM pg_policies WHERE schemaname = 'public'
ORDER BY table_name;
```

**Expected Results**:
```
auth.users:     1
fuel_prices:    2
notifications:  1
RLS Policies:   42 (or more)
reservations:   0
stations:       0
users:          1
```

---

### **Step 4: Update Frontend Configuration**

Your `/lib/supabase/config.ts` file already has the correct URL. Just verify it matches:

```typescript
export const supabaseConfig: SupabaseConfig = {
  url: 'https://nylwaavkajrkwwmrkjqg.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55bHdhYXZrYWpya3d3bXJranFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MzgyMzEsImV4cCI6MjA4OTAxNDIzMX0.KUgZqnK3oxWG7G4EX6sfZEuj2qAOII_z6REs8dGCxIg',
};
```

**🚨 CRITICAL**: These values MUST match your Supabase dashboard exactly!

---

### **Step 5: Restart Your App**

1. Stop your development server (Ctrl+C)
2. Clear node_modules/.cache (if exists)
3. Restart: `npm run dev` or `yarn dev`
4. Hard refresh browser: Ctrl+Shift+R

---

### **Step 6: Test Authentication**

#### Test 1: Admin Login
1. Go to: http://localhost:3000/login
2. Enter:
   - Email: `admin@quickfuel.com`
   - Password: `Admin123!`
3. Click **Sign In**

**Expected**: ✅ Redirects to `/admin` dashboard

**If it fails**: Check Step 7 below

#### Test 2: Driver Registration
1. Go to: http://localhost:3000/register/driver
2. Fill in form:
   - Full Name: `Test Driver`
   - Email: `driver@test.com`
   - Phone: `+251911234567`
   - Password: `Test123!`
   - Address: `Addis Ababa`
   - Vehicle Model: `Toyota Corolla`
   - Plate Number: `AA-3-12345`
   - License Number: `ETH123456`
   - Fuel Type: `Petrol`
3. Click **Register**

**Expected**: ✅ Creates account and redirects to `/driver`

---

### **Step 7: Troubleshooting (If Still Failing)**

#### Issue: Login still gives 401

**Check 1**: Verify admin user exists
```sql
SELECT id, email, email_confirmed_at, confirmed_at
FROM auth.users 
WHERE email = 'admin@quickfuel.com';
```

If `email_confirmed_at` is NULL:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW(), confirmed_at = NOW()
WHERE email = 'admin@quickfuel.com';
```

**Check 2**: Verify correct project URL
Open browser DevTools → Network tab → Look at failed request URL.

Does it show:
- ✅ `https://nylwaavkajrkwwmrkjqg.supabase.co` (correct)
- ❌ `https://djfzgxnquxzbnxfjvkcp.supabase.co` (wrong - old project)

If showing wrong URL, your config didn't update. Try:
1. Hard refresh: Ctrl+Shift+R
2. Clear localStorage: DevTools → Application → Local Storage → Delete All
3. Restart dev server

**Check 3**: Verify anon key is correct
```typescript
// In browser console:
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
```

Should output your correct values.

**Check 4**: Check Supabase logs
1. Go to **Logs** → **Auth Logs**
2. Look for recent login attempts
3. Check error messages

#### Issue: Registration gives 422

**Cause**: Email confirmation is still enabled

**Fix**:
1. Go to **Authentication** → **Settings**
2. **Disable "Confirm email"**
3. Click **Save**
4. Wait 30 seconds
5. Try again

#### Issue: User created but data doesn't load

**Cause**: User profile not created in `users` table

**Fix**:
```sql
-- Check if profile exists
SELECT * FROM users WHERE email = 'driver@test.com';

-- If missing, create manually:
INSERT INTO users (id, email, full_name, phone, role, address, vehicle_model, plate_number, license_number, preferred_fuel_type)
SELECT 
  id, 
  email,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'phone',
  'driver',
  raw_user_meta_data->>'address',
  raw_user_meta_data->>'vehicle_model',
  raw_user_meta_data->>'plate_number',
  raw_user_meta_data->>'license_number',
  raw_user_meta_data->>'preferred_fuel_type'
FROM auth.users
WHERE email = 'driver@test.com';
```

---

## 🎯 Quick Checklist

Before testing, verify ALL of these:

- [ ] Email confirmation is **DISABLED** in Supabase
- [ ] Redirect URLs are added
- [ ] All 3 SQL scripts have been run
- [ ] Admin user exists in database
- [ ] Config file has correct URL and anon key
- [ ] Browser cache is cleared
- [ ] Dev server is restarted

---

## 🔍 Debugging Tools

### Check Auth Status in Browser
```javascript
// Open browser console and run:
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

### Check RLS Policies
```sql
-- List all policies for a table
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';
```

### Check Database Connection
```sql
-- Test basic query
SELECT NOW() as current_time;
```

---

## 📊 Expected Database State

After successful setup:

### auth.users table
```
1 row: admin@quickfuel.com (confirmed)
```

### users table
```
1 row: Admin profile with role='admin'
```

### fuel_prices table
```
2 rows: Petrol (65.00), Diesel (58.00)
```

### notifications table
```
1 row: Welcome notification for admin
```

### system_activity table
```
1 row: Admin creation activity log
```

---

## 🚀 Success Criteria

You'll know it's working when:

1. ✅ Login redirects to dashboard (no 401 error)
2. ✅ User data loads on dashboard
3. ✅ Can create new users without errors
4. ✅ Network tab shows 200 responses
5. ✅ No console errors

---

## 💡 Common Mistakes

1. ❌ **Using old project URL**: Always verify URL in errors matches config
2. ❌ **Email confirmation enabled**: Most common cause of 401s
3. ❌ **Skipping SQL scripts**: Database must be set up first
4. ❌ **Wrong anon key**: Must match exactly from Supabase dashboard
5. ❌ **Not clearing cache**: Old auth tokens can persist

---

## 📞 Still Having Issues?

### Debug Steps
1. Check browser console for errors
2. Check Network tab for failed requests
3. Check Supabase Auth Logs
4. Verify database tables exist
5. Verify RLS policies are active

### Provide This Info
If you need help, collect:
- Browser console errors
- Network tab request/response
- Supabase project URL
- Which SQL scripts you ran
- Auth settings screenshot

---

## ✅ Final Verification

Run this complete verification:

```sql
-- COMPLETE SYSTEM CHECK
SELECT 'Database Tables' as check_type, COUNT(*)::text as result
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'

UNION ALL

SELECT 'RLS Policies', COUNT(*)::text
FROM pg_policies WHERE schemaname = 'public'

UNION ALL

SELECT 'Triggers', COUNT(*)::text
FROM pg_trigger 
WHERE tgname NOT LIKE 'RI_%'

UNION ALL

SELECT 'Indexes', COUNT(*)::text
FROM pg_indexes 
WHERE schemaname = 'public'

UNION ALL

SELECT 'Admin User Exists', 
  CASE WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@quickfuel.com') 
    THEN 'YES ✅' 
    ELSE 'NO ❌' 
  END

UNION ALL

SELECT 'Admin Email Confirmed',
  CASE WHEN EXISTS(
    SELECT 1 FROM auth.users 
    WHERE email = 'admin@quickfuel.com' 
    AND email_confirmed_at IS NOT NULL
  ) 
    THEN 'YES ✅' 
    ELSE 'NO ❌' 
  END

UNION ALL

SELECT 'User Profile Created',
  CASE WHEN EXISTS(SELECT 1 FROM users WHERE role = 'admin') 
    THEN 'YES ✅' 
    ELSE 'NO ❌' 
  END

UNION ALL

SELECT 'Fuel Prices Set',
  CASE WHEN (SELECT COUNT(*) FROM fuel_prices) = 2 
    THEN 'YES ✅' 
    ELSE 'NO ❌' 
  END

ORDER BY check_type;
```

**Expected Results**:
```
Admin Email Confirmed:   YES ✅
Admin User Exists:       YES ✅
Database Tables:         10
Fuel Prices Set:         YES ✅
Indexes:                 68+
RLS Policies:            42+
Triggers:                6+
User Profile Created:    YES ✅
```

---

## 🎉 You're Done!

If all checks pass, your system is ready to use!

**Next Steps**:
1. Login as admin
2. Create fuel stations
3. Test driver registration
4. Create test reservations
5. Verify real-time updates work

**Your QuickFuel system is now fully operational! 🚀**
