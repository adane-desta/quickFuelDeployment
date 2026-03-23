# 🚀 QuickFuel Supabase Setup Guide

## 🔴 **FIXING YOUR 401 UNAUTHORIZED ERRORS**

Your errors indicate authentication issues. Follow these steps **EXACTLY** to fix them.

---

## 📋 **Prerequisites**

- Supabase account (free tier works)
- Access to Supabase SQL Editor
- Your Supabase project created

---

## ✅ **STEP-BY-STEP SETUP**

### **Step 1: Get Your Supabase Credentials**

1. Go to https://supabase.com/dashboard
2. Select your project: `nylwaavkajrkwwmrkjqg`
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL**: `https://nylwaavkajrkwwmrkjqg.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long key)

### **Step 2: Configure Authentication Settings**

1. Go to **Authentication** → **Providers** → **Email**
2. ✅ Enable **Email provider**
3. ✅ Enable **Confirm email** (TURN THIS OFF for development)
   - Go to **Settings** → **Auth** → **Email Templates**
   - Disable "Confirm email" requirement
4. Click **Save**

**IMPORTANT**: For development, disable email confirmation. Re-enable in production.

### **Step 3: Configure URL Settings**

1. Go to **Authentication** → **URL Configuration**
2. Add these URLs:
   ```
   Site URL: http://localhost:3000
   Redirect URLs: 
   - http://localhost:3000
   - http://localhost:3000/login
   - http://localhost:3000/admin
   - http://localhost:3000/driver
   - http://localhost:3000/operator
   ```
3. Click **Save**

### **Step 4: Run Database Setup Scripts**

Execute these scripts **IN ORDER** in Supabase SQL Editor:

#### 4.1 Create Database Schema

```sql
-- Copy and paste entire contents of /DATABASE_SCHEMA_COMPLETE.sql
-- This creates all 10 tables with proper structure
```

#### 4.2 Apply Security Policies

```sql
-- Copy and paste entire contents of /DATABASE_RLS_POLICIES.sql
-- This sets up Row Level Security for all tables
```

#### 4.3 Insert Initial Data

```sql
-- Copy and paste entire contents of /DATABASE_INITIAL_DATA.sql
-- This creates admin user and fuel prices
```

### **Step 5: Verify Database Setup**

Run this query in Supabase SQL Editor:

```sql
-- Check if everything is set up correctly
SELECT 'Admin User' as check_type, COUNT(*) as count 
FROM auth.users WHERE email = 'admin@quickfuel.com'
UNION ALL
SELECT 'User Profiles', COUNT(*) FROM users
UNION ALL
SELECT 'Fuel Prices', COUNT(*) FROM fuel_prices
UNION ALL
SELECT 'Stations', COUNT(*) FROM stations
UNION ALL
SELECT 'RLS Enabled', COUNT(*) 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true;
```

**Expected Results:**
- Admin User: 1
- User Profiles: 1
- Fuel Prices: 2
- Stations: 0 (or 3 if you ran sample data)
- RLS Enabled: 10

### **Step 6: Update Your Frontend Configuration**

Your `/lib/supabase/config.ts` should have:

```typescript
export const supabaseConfig: SupabaseConfig = {
  url: 'https://nylwaavkajrkwwmrkjqg.supabase.co',
  anonKey: 'YOUR_ACTUAL_ANON_KEY_HERE', // Get from Step 1
};
```

**🚨 CRITICAL**: Replace `YOUR_ACTUAL_ANON_KEY_HERE` with your actual anon key from Step 1!

---

## 🧪 **TEST YOUR SETUP**

### Test 1: Admin Login

1. Go to http://localhost:3000/login
2. Enter credentials:
   - **Email**: `admin@quickfuel.com`
   - **Password**: `Admin123!`
3. Click **Sign In**
4. ✅ Should redirect to `/admin` dashboard

### Test 2: Driver Registration

1. Go to http://localhost:3000/register/driver
2. Fill in the form with valid Ethiopian formats:
   - **Phone**: `+251911234567` or `0911234567`
   - **Plate Number**: `AA-3-12345`
3. Click **Register**
4. ✅ Should create account and redirect to `/driver`

### Test 3: Verify Database

```sql
-- Check registered users
SELECT id, email, full_name, role, created_at 
FROM users 
ORDER BY created_at DESC;

-- Check auth users
SELECT id, email, email_confirmed_at 
FROM auth.users 
ORDER BY created_at DESC;
```

---

## 🔧 **TROUBLESHOOTING**

### Issue: Still Getting 401 Errors

**Check 1: Verify Auth Settings**
```sql
SELECT * FROM auth.users WHERE email = 'admin@quickfuel.com';
```

If `email_confirmed_at` is NULL:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW(), confirmed_at = NOW() 
WHERE email = 'admin@quickfuel.com';
```

**Check 2: Verify Supabase URL**

Your config shows: `https://nylwaavkajrkwwmrkjqg.supabase.co`
Your errors show: `https://djfzgxnquxzbnxfjvkcp.supabase.co`

**🚨 These MUST match!** Update your config to match your actual Supabase project.

**Check 3: Clear Browser Cache**

1. Open DevTools (F12)
2. Right-click Refresh button
3. Select "Empty Cache and Hard Reload"

**Check 4: Verify RLS Policies**

```sql
-- List all policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Should show policies for all 10 tables.

### Issue: Cannot Create Admin User

If you get an error creating admin user, try this alternative:

```sql
-- Delete existing admin if corrupted
DELETE FROM auth.users WHERE email = 'admin@quickfuel.com';

-- Run the admin creation block again from DATABASE_INITIAL_DATA.sql
```

### Issue: Registration Fails with 422 Error

**Cause**: Email confirmation is enabled

**Fix**:
1. Go to **Authentication** → **Settings**
2. Disable "Confirm email"
3. Click **Save**

### Issue: Login Works but User Data Not Loading

**Cause**: RLS policies blocking access

**Fix**:
```sql
-- Check if user profile exists
SELECT * FROM users WHERE email = 'YOUR_EMAIL@example.com';

-- If missing, the trigger might have failed
-- Manually insert profile:
INSERT INTO users (id, email, full_name, phone, role)
SELECT id, email, 
       COALESCE(raw_user_meta_data->>'full_name', 'User'),
       COALESCE(raw_user_meta_data->>'phone', '+251911000000'),
       COALESCE(raw_user_meta_data->>'role', 'driver')
FROM auth.users 
WHERE email = 'YOUR_EMAIL@example.com';
```

---

## 📊 **DATABASE SCHEMA OVERVIEW**

### Core Tables (10)

1. **users** - User profiles (extends auth.users)
2. **stations** - Fuel station locations and inventory
3. **fuel_prices** - System-wide fuel pricing
4. **reservations** - Fuel reservations and purchases
5. **notifications** - User notifications
6. **queue_reports** - Real-time queue status
7. **fuel_analytics** - Fuel dispensing records
8. **system_activity** - Audit logs
9. **reviews** - Station ratings
10. **payment_transactions** - Payment records

### Key Features

- ✅ **Row Level Security (RLS)** on all tables
- ✅ **Real-time subscriptions** enabled
- ✅ **Automatic triggers** for data consistency
- ✅ **Optimized indexes** for performance
- ✅ **Ethiopian validations** (phone, plate number)
- ✅ **Comprehensive audit logging**

---

## 🎯 **WHAT EACH ROLE CAN DO**

### Admin
- ✅ View all users, stations, reservations
- ✅ Create/edit fuel stations
- ✅ Update fuel prices
- ✅ View system analytics
- ✅ Manage all system data

### Operator
- ✅ View/update their station's data
- ✅ Manage fuel inventory
- ✅ Process reservations for their station
- ✅ View station analytics
- ❌ Cannot access other stations

### Driver
- ✅ Create fuel reservations
- ✅ View their own reservations
- ✅ Submit queue reports
- ✅ Write station reviews
- ❌ Cannot see other drivers' data

---

## 🔐 **SECURITY FEATURES**

1. **Authentication**: Supabase Auth with JWT tokens
2. **Authorization**: Role-based access control (RLS policies)
3. **Data Isolation**: Users can only access their own data
4. **Audit Trail**: All actions logged in system_activity
5. **Input Validation**: Database-level constraints
6. **Ethiopian Formats**: Phone (+251XXXXXXXXX), Plate (AA-1-12345)

---

## 📱 **ETHIOPIAN-SPECIFIC VALIDATIONS**

### Phone Number Format
```
Valid: +251911234567, 0911234567, +251922345678
Invalid: 0711234567 (must start with 9), +1234567890 (wrong country)
```

### Plate Number Format
```
Valid: AA-3-12345, ET-1-54321, ABC-5-99999
Invalid: AA312345 (missing dashes), AA-33-12345 (wrong format)
```

### Coordinates (Addis Ababa Area)
```
Latitude: 8.0 to 10.0 (°N)
Longitude: 37.0 to 40.0 (°E)
```

---

## 🚀 **NEXT STEPS AFTER SETUP**

1. ✅ Login as admin: `admin@quickfuel.com` / `Admin123!`
2. ✅ Go to Admin Dashboard → **Station Management**
3. ✅ Click **Add New Station**
4. ✅ Fill in station details:
   - Name: "Total Station - Bole"
   - Address: "Bole Road, Addis Ababa"
   - Phone: "+251911234567"
   - Coordinates: Lat 9.0103, Lng 38.7620
   - Initial Stock: Petrol 5000L, Diesel 4500L
5. ✅ Click **Create Station**
6. ✅ Assign an operator (create operator account first)
7. ✅ Test driver registration
8. ✅ Test creating a reservation
9. ✅ Test the complete 5-step reservation flow

---

## 📞 **SUPPORT**

If you encounter issues:

1. Check browser console for errors
2. Check Supabase logs: **Database** → **Logs**
3. Verify auth settings: **Authentication** → **Settings**
4. Review RLS policies in SQL Editor
5. Check this guide's troubleshooting section

---

## ✨ **SYSTEM IS READY!**

After completing all steps above:

- ✅ Database schema is perfect
- ✅ Security policies are active
- ✅ Admin account is ready
- ✅ Fuel prices are set
- ✅ Real-time updates enabled
- ✅ Ready for production use

**Happy coding! 🚀**
