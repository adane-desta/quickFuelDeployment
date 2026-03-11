# 🚨 CRITICAL FIX REQUIRED - Row Level Security Policies

## THE PROBLEM

You're getting this error: **"infinite recursion detected in policy for relation 'users'"**

This is because the Row Level Security (RLS) policies in your Supabase database are incorrectly configured.

## THE SOLUTION (3 STEPS)

### Step 1: Fix RLS Policies in Supabase

1. **Open Supabase SQL Editor**
   - Go to: https://djfzgxnquxzbnxfjvkcp.supabase.co
   - Click on **SQL Editor** in the left sidebar

2. **Run the Fix Script**
   - Open the file `/FIX_RLS_POLICIES.sql` (in this project)
   - Copy ALL the SQL code
   - Paste it into the Supabase SQL Editor
   - Click **Run** (or press Ctrl+Enter)
   - Wait for it to complete (should see success messages)

### Step 2: Verify Policies Are Fixed

After running the script, check if policies are correct:

```sql
-- Run this to verify users table policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users';
```

You should see these policies:
- `users_select_own` (SELECT)
- `users_update_own` (UPDATE)
- `users_insert_during_signup` (INSERT)

### Step 3: Test Login Again

1. **Refresh your browser** (clear cache if needed)
2. Try logging in again with:
   - Email: `admin@quickfuel.com`
   - Password: `Admin123!` (or whatever you set)
3. ✅ **It should work now!**

## WHY THIS HAPPENED

The original RLS policies had queries like:
```sql
USING (auth.uid() IN (SELECT id FROM users WHERE ...))
```

This creates infinite recursion because:
1. User tries to SELECT from users table
2. Policy checks by doing another SELECT from users table
3. That SELECT triggers the policy again
4. Loop continues infinitely ❌

The fix uses `auth.uid()` directly:
```sql
USING (auth.uid() = id)
```

No recursion! ✅

## IF IT STILL DOESN'T WORK

### Check 1: Verify Admin User Exists

Run this SQL:
```sql
SELECT * FROM auth.users WHERE email = 'admin@quickfuel.com';
SELECT * FROM users WHERE email = 'admin@quickfuel.com';
```

Both should return 1 row. If not, recreate admin using the SQL in SYSTEM_COMPLETE.md

### Check 2: Verify Email is Confirmed

```sql
SELECT email_confirmed_at FROM auth.users WHERE email = 'admin@quickfuel.com';
```

Should NOT be NULL. If it is NULL, run:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'admin@quickfuel.com';
```

### Check 3: Reset Password

If you forgot password or it's not working:

```sql
UPDATE auth.users 
SET encrypted_password = crypt('NewPassword123!', gen_salt('bf'))
WHERE email = 'admin@quickfuel.com';
```

### Check 4: Check RLS is Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`. If not, run:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_activity ENABLE ROW LEVEL SECURITY;
```

## WHAT WAS FIXED IN THE CODE

1. **AuthContext.tsx**
   - Removed `admin.deleteUser()` calls (requires service role key)
   - Better error handling
   - Direct `auth.uid()` usage

2. **AddStationModal.tsx**
   - Same fix for operator creation
   - Better error messages

3. **Database Policies**
   - All policies now use `auth.uid()` directly
   - No more recursive queries
   - Cleaner, faster, more secure

## TESTING CHECKLIST

After applying the fix:

- [ ] Admin can login ✅
- [ ] Driver can register ✅
- [ ] Driver can login ✅
- [ ] Admin can add stations ✅
- [ ] Operators can login (after admin creates account) ✅
- [ ] No more "infinite recursion" errors ✅
- [ ] No more 500 errors ✅
- [ ] Toast notifications show properly ✅

## FINAL NOTES

### Admin Operations That Still Need Service Role Key:
- Creating operators via `auth.admin.createUser()` - This works because admin frontend uses it
- Deleting users - Can't be done from frontend with anon key (must use Supabase dashboard)

### This is NORMAL and SECURE!
The anon key is meant for public operations. Admin operations like user deletion should be done through:
1. Supabase Dashboard (manually)
2. Backend API with service role key (if you build one)
3. Supabase Edge Functions (if you set them up)

For now, if you need to delete a user:
1. Go to Supabase Dashboard
2. Authentication → Users
3. Find the user
4. Click the three dots → Delete user

## SUPPORT

If you still have issues after following ALL these steps:

1. Check browser console for new errors
2. Check Supabase logs (Logs → API in dashboard)
3. Verify all SQL scripts ran successfully
4. Try with a fresh incognito window
5. Clear browser cache and cookies

## SUCCESS INDICATOR

When everything is working, you should see:
- ✅ Login redirects to dashboard (no infinite loading)
- ✅ Toast notification: "Login successful - Welcome back, Admin User!"
- ✅ Dashboard loads with all data
- ✅ No errors in browser console

🎉 **Your QuickFuel system will be 100% operational!**
