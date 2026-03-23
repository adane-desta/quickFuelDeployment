# ⚡ QuickFuel Database Quick Reference

## 🚀 Quick Start (3 Steps)

### 1. Run SQL Scripts (in order)
```sql
-- In Supabase SQL Editor:

-- Step 1: Create Schema (tables, indexes, triggers)
-- Copy/paste: /DATABASE_SCHEMA_COMPLETE.sql

-- Step 2: Apply Security (RLS policies)
-- Copy/paste: /DATABASE_RLS_POLICIES.sql

-- Step 3: Insert Initial Data (admin, prices)
-- Copy/paste: /DATABASE_INITIAL_DATA.sql
```

### 2. Configure Auth Settings
```
Supabase Dashboard → Authentication → Settings
✅ Enable Email provider
❌ Disable "Confirm email" (for dev)
```

### 3. Update Frontend Config
```typescript
// /lib/supabase/config.ts
export const supabaseConfig = {
  url: 'YOUR_PROJECT_URL',      // Get from Settings → API
  anonKey: 'YOUR_ANON_KEY',     // Get from Settings → API
};
```

---

## 📊 Tables Cheat Sheet

| Table | Purpose | Key Columns | Who Can Access |
|-------|---------|-------------|----------------|
| **users** | User profiles | id, email, role, phone | Own profile + admins |
| **stations** | Fuel stations | name, lat/lng, stock | Everyone (public) |
| **fuel_prices** | Fuel pricing | fuel_type, price_per_liter | Everyone (public) |
| **reservations** | Fuel orders | driver_id, station_id, status | Own + related |
| **notifications** | User alerts | user_id, title, is_read | Own only |
| **queue_reports** | Queue status | station_id, queue_length | Everyone (public) |
| **fuel_analytics** | Fuel sales | station_id, revenue | Station + admins |
| **system_activity** | Audit logs | action, user_id | Admins only |
| **reviews** | Station ratings | station_id, rating | Everyone (public) |
| **payment_transactions** | Payments | reservation_id, status | Own + related |

---

## 🔐 Role Permissions

### Admin
```
✅ View/edit all data
✅ Create stations
✅ Update fuel prices
✅ View analytics
✅ Manage users
```

### Operator
```
✅ View/edit their station
✅ Update fuel inventory
✅ Process reservations
✅ View station analytics
❌ Cannot see other stations
```

### Driver
```
✅ Create reservations
✅ View own reservations
✅ Submit queue reports
✅ Write reviews
❌ Cannot see other drivers
```

---

## 🔄 Reservation Status Flow

```
pending
  ↓
confirmed (pickup_code generated)
  ↓
completed (fuel dispensed)

OR

cancelled (at any point)
```

**Payment must be "paid" before completion**

---

## 🇪🇹 Ethiopian Formats

### Phone Numbers
```
✅ Valid:   +251911234567, 0911234567, +251922345678
❌ Invalid: 0711234567, +1234567890, 911234567
```

### Plate Numbers
```
✅ Valid:   AA-3-12345, ET-1-54321, ABC-5-99999
❌ Invalid: AA312345, AA-33-12345, A-1-12345
```

### Coordinates (Addis Ababa)
```
Latitude:  8.0 to 10.0 (°N)
Longitude: 37.0 to 40.0 (°E)
Example: 9.0103, 38.7620 (Bole area)
```

---

## ⚡ Common Queries

### Get Active Stations Near Location
```sql
SELECT *
FROM stations
WHERE is_active = true
  AND petrol_available = true
  AND latitude BETWEEN :lat - 0.1 AND :lat + 0.1
  AND longitude BETWEEN :lng - 0.1 AND :lng + 0.1
ORDER BY average_rating DESC;
```

### Get Driver's Active Reservations
```sql
SELECT r.*, s.name as station_name
FROM reservations r
JOIN stations s ON r.station_id = s.id
WHERE r.driver_id = :driver_id
  AND r.status IN ('pending', 'confirmed')
ORDER BY r.created_at DESC;
```

### Get Station Queue Status
```sql
SELECT 
  station_id,
  AVG(queue_length)::int as avg_queue,
  AVG(wait_time_minutes)::int as avg_wait
FROM queue_reports
WHERE reported_at > NOW() - INTERVAL '30 minutes'
GROUP BY station_id;
```

### Get Today's Revenue for Station
```sql
SELECT 
  SUM(revenue) as total_revenue,
  SUM(quantity_dispensed) as total_liters,
  COUNT(*) as total_transactions
FROM fuel_analytics
WHERE station_id = :station_id
  AND recorded_at >= CURRENT_DATE;
```

---

## 🔧 Useful Functions

### Calculate Average Wait Time
```sql
SELECT calculate_average_wait_time(:station_id);
```

### Update Station Stock
```sql
UPDATE stations
SET 
  petrol_stock = :new_petrol_stock,
  diesel_stock = :new_diesel_stock
WHERE id = :station_id;
-- Availability flags auto-update via trigger
```

### Create Notification
```sql
INSERT INTO notifications (user_id, type, title, message, priority)
VALUES (:user_id, 'system', 'Test', 'Hello!', 'normal');
```

---

## 🚨 Troubleshooting

### 401 Unauthorized
```sql
-- Check if email is confirmed
SELECT email, email_confirmed_at 
FROM auth.users 
WHERE email = :your_email;

-- Fix if needed
UPDATE auth.users 
SET email_confirmed_at = NOW(), confirmed_at = NOW()
WHERE email = :your_email;
```

### User Profile Missing
```sql
-- Check if profile exists
SELECT * FROM users WHERE email = :your_email;

-- Create if missing
INSERT INTO users (id, email, full_name, phone, role)
SELECT id, email, 
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'phone',
  raw_user_meta_data->>'role'
FROM auth.users
WHERE email = :your_email;
```

### RLS Policy Blocking Access
```sql
-- Check active policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = :table_name;

-- Test query as specific user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = :user_id;
SELECT * FROM :table_name;
```

### Stock Not Updating
```sql
-- Check if trigger exists
SELECT tgname 
FROM pg_trigger 
WHERE tgname = 'on_stock_change';

-- Manually update availability
UPDATE stations
SET 
  petrol_available = (petrol_stock > 100),
  diesel_available = (diesel_stock > 100)
WHERE id = :station_id;
```

---

## 📈 Performance Tips

1. **Use Indexes**: All foreign keys and frequently filtered columns are indexed
2. **Limit Results**: Always use LIMIT for large result sets
3. **Use Realtime**: Subscribe to changes instead of polling
4. **Batch Operations**: Use transactions for multiple inserts/updates
5. **Cache Public Data**: Stations and fuel prices rarely change

---

## 🔒 Security Checklist

- [x] RLS enabled on all tables
- [x] Policies enforce role-based access
- [x] Foreign keys prevent orphaned records
- [x] Check constraints validate data
- [x] Triggers maintain consistency
- [x] Audit logs track all actions
- [x] Unique constraints prevent duplicates
- [x] Cascading deletes handle cleanup

---

## 📞 Admin Credentials

```
Email: admin@quickfuel.com
Password: Admin123!
```

**⚠️ Change this password in production!**

---

## 🎯 Testing Checklist

### After Setup
- [ ] Admin can login
- [ ] Driver can register
- [ ] Operator can be created (by admin)
- [ ] Station can be added (by admin)
- [ ] Fuel prices are visible
- [ ] Reservation can be created
- [ ] Payment flow works
- [ ] Notifications appear
- [ ] Real-time updates work

### Verification Queries
```sql
-- Check all tables created
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return 10

-- Check all triggers created
SELECT COUNT(*) FROM pg_trigger 
WHERE tgname LIKE '%users%' OR tgname LIKE '%stations%';
-- Should return 6+

-- Check all policies created
SELECT COUNT(*) FROM pg_policies 
WHERE schemaname = 'public';
-- Should return 42+

-- Check indexes created
SELECT COUNT(*) FROM pg_indexes 
WHERE schemaname = 'public';
-- Should return 68+
```

---

## 📚 Additional Resources

- **Full Documentation**: `/DATABASE_DOCUMENTATION.md`
- **Setup Guide**: `/SUPABASE_SETUP_GUIDE.md`
- **Schema SQL**: `/DATABASE_SCHEMA_COMPLETE.sql`
- **RLS Policies**: `/DATABASE_RLS_POLICIES.sql`
- **Initial Data**: `/DATABASE_INITIAL_DATA.sql`

---

## 💡 Pro Tips

1. **Development Mode**: Disable email confirmation in Supabase Auth settings
2. **Debug RLS**: Use Supabase Dashboard → Table Editor to test queries
3. **Monitor Performance**: Check Supabase → Database → Logs regularly
4. **Backup Data**: Enable Point-in-Time Recovery in Supabase settings
5. **Test with Sample Data**: Uncomment sample stations in initial data script

---

## 🎉 You're Ready!

Your QuickFuel database is production-ready with:
- ✅ Perfect schema design
- ✅ Strong security (RLS)
- ✅ Optimized performance
- ✅ Ethiopian validations
- ✅ Real-time updates
- ✅ Complete audit trail

**Now go build something amazing! 🚀**
