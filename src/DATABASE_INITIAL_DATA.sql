-- =====================================================
-- QUICKFUEL INITIAL DATA & SAMPLE RECORDS
-- =====================================================
-- Inserts initial data for testing and demonstration
-- Creates admin user, fuel prices, and sample stations
-- =====================================================

-- =====================================================
-- STEP 1: INSERT FUEL PRICES
-- =====================================================

INSERT INTO fuel_prices (fuel_type, price_per_liter, effective_from, updated_by, change_reason)
VALUES 
  ('Petrol', 65.00, CURRENT_DATE, 'System Administrator', 'Initial system setup'),
  ('Diesel', 58.00, CURRENT_DATE, 'System Administrator', 'Initial system setup')
ON CONFLICT (fuel_type) DO UPDATE SET
  price_per_liter = EXCLUDED.price_per_liter,
  effective_from = EXCLUDED.effective_from,
  updated_by = EXCLUDED.updated_by,
  updated_at = NOW();

-- =====================================================
-- STEP 2: CREATE ADMIN USER
-- =====================================================

DO $$
DECLARE
  admin_uuid UUID;
  admin_exists BOOLEAN;
BEGIN
  -- Check if admin already exists
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = 'admin@quickfuel.com'
  ) INTO admin_exists;
  
  IF NOT admin_exists THEN
    -- Create auth user with proper password hash
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
      is_super_admin,
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
      '{"full_name":"System Administrator","phone":"+251911000000","role":"admin"}',
      false,
      '',
      '',
      ''
    ) RETURNING id INTO admin_uuid;

    -- Create user profile
    INSERT INTO public.users (
      id, 
      email, 
      full_name, 
      phone, 
      role, 
      employee_id, 
      department,
      is_active
    ) VALUES (
      admin_uuid,
      'admin@quickfuel.com',
      'System Administrator',
      '+251911000000',
      'admin',
      'EMP001',
      'System Administration',
      true
    );

    -- Create welcome notification for admin
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      priority
    ) VALUES (
      admin_uuid,
      'system',
      'Welcome to QuickFuel!',
      'Your administrator account has been created successfully. You can now manage the entire QuickFuel platform.',
      'high'
    );

    -- Log admin creation
    INSERT INTO system_activity (
      user_id,
      user_role,
      user_email,
      action,
      description,
      category,
      success
    ) VALUES (
      admin_uuid,
      'admin',
      'admin@quickfuel.com',
      'ADMIN_CREATED',
      'System administrator account created during initial setup',
      'auth',
      true
    );

    RAISE NOTICE '✅ Admin user created successfully!';
    RAISE NOTICE '   Email: admin@quickfuel.com';
    RAISE NOTICE '   Password: Admin123!';
    RAISE NOTICE '   User ID: %', admin_uuid;
  ELSE
    -- Update existing admin to ensure email is confirmed
    UPDATE auth.users 
    SET 
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmed_at = COALESCE(confirmed_at, NOW())
    WHERE email = 'admin@quickfuel.com';
    
    RAISE NOTICE '⚠️  Admin user already exists - email confirmation updated';
  END IF;
END $$;

-- =====================================================
-- STEP 3: CREATE SAMPLE STATIONS (OPTIONAL)
-- =====================================================
-- Uncomment to create sample fuel stations for testing

/*
DO $$
DECLARE
  station1_id UUID := gen_random_uuid();
  station2_id UUID := gen_random_uuid();
  station3_id UUID := gen_random_uuid();
BEGIN
  -- Sample Station 1: Total Station (Bole)
  INSERT INTO stations (
    id,
    name,
    address,
    phone,
    operating_hours,
    latitude,
    longitude,
    petrol_stock,
    diesel_stock,
    petrol_available,
    diesel_available,
    is_verified,
    is_active,
    average_rating,
    total_reviews,
    amenities
  ) VALUES (
    station1_id,
    'Total Station - Bole',
    'Bole Road, Near Edna Mall, Addis Ababa',
    '+251911234567',
    '24/7',
    9.0103,
    38.7620,
    5000.00,
    4500.00,
    true,
    true,
    true,
    true,
    4.5,
    127,
    '["restroom", "car_wash", "shop", "atm"]'::jsonb
  );

  -- Sample Station 2: NOC Station (Megenagna)
  INSERT INTO stations (
    id,
    name,
    address,
    phone,
    operating_hours,
    latitude,
    longitude,
    petrol_stock,
    diesel_stock,
    petrol_available,
    diesel_available,
    is_verified,
    is_active,
    average_rating,
    total_reviews,
    amenities
  ) VALUES (
    station2_id,
    'NOC Station - Megenagna',
    'Megenagna, CMC Road, Addis Ababa',
    '+251911345678',
    '06:00 - 22:00',
    9.0320,
    38.7830,
    3500.00,
    3000.00,
    true,
    true,
    true,
    true,
    4.2,
    89,
    '["restroom", "shop"]'::jsonb
  );

  -- Sample Station 3: Oilibya Station (Piazza)
  INSERT INTO stations (
    id,
    name,
    address,
    phone,
    operating_hours,
    latitude,
    longitude,
    petrol_stock,
    diesel_stock,
    petrol_available,
    diesel_available,
    is_verified,
    is_active,
    average_rating,
    total_reviews,
    amenities
  ) VALUES (
    station3_id,
    'Oilibya Station - Piazza',
    'Piazza Area, Churchill Avenue, Addis Ababa',
    '+251911456789',
    '24/7',
    9.0354,
    38.7636,
    2000.00,
    2500.00,
    true,
    true,
    true,
    true,
    4.0,
    65,
    '["restroom", "car_wash", "atm"]'::jsonb
  );

  RAISE NOTICE '✅ Sample stations created successfully!';
  RAISE NOTICE '   Total Station - Bole: %', station1_id;
  RAISE NOTICE '   NOC Station - Megenagna: %', station2_id;
  RAISE NOTICE '   Oilibya Station - Piazza: %', station3_id;
END $$;
*/

-- =====================================================
-- STEP 4: GRANT PERMISSIONS
-- =====================================================

-- Grant all permissions to authenticated users on public tables
GRANT ALL ON users TO authenticated;
GRANT ALL ON stations TO authenticated;
GRANT ALL ON fuel_prices TO authenticated;
GRANT ALL ON reservations TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON queue_reports TO authenticated;
GRANT ALL ON fuel_analytics TO authenticated;
GRANT ALL ON system_activity TO authenticated;
GRANT ALL ON reviews TO authenticated;
GRANT ALL ON payment_transactions TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_average_wait_time(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_station_stock_on_reservation() TO authenticated;
GRANT EXECUTE ON FUNCTION update_station_availability() TO authenticated;
GRANT EXECUTE ON FUNCTION create_reservation_notification() TO authenticated;

-- =====================================================
-- STEP 5: ENABLE REALTIME SUBSCRIPTIONS
-- =====================================================

-- Enable realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE stations;
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE queue_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE fuel_prices;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_transactions;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the setup

-- Check admin user in auth.users
SELECT 
  id, 
  email, 
  email_confirmed_at, 
  confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'admin@quickfuel.com';

-- Check admin profile in users table
SELECT 
  id, 
  email, 
  full_name, 
  role,
  employee_id,
  department,
  is_active,
  created_at
FROM users 
WHERE role = 'admin';

-- Check fuel prices
SELECT 
  fuel_type, 
  price_per_liter, 
  effective_from,
  updated_by,
  updated_at
FROM fuel_prices 
ORDER BY fuel_type;

-- Check all tables row counts
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'stations', COUNT(*) FROM stations
UNION ALL
SELECT 'fuel_prices', COUNT(*) FROM fuel_prices
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'queue_reports', COUNT(*) FROM queue_reports
UNION ALL
SELECT 'fuel_analytics', COUNT(*) FROM fuel_analytics
UNION ALL
SELECT 'system_activity', COUNT(*) FROM system_activity
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'payment_transactions', COUNT(*) FROM payment_transactions
ORDER BY table_name;

-- Check RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'stations', 'fuel_prices', 'reservations', 
    'notifications', 'queue_reports', 'fuel_analytics', 
    'system_activity', 'reviews', 'payment_transactions'
  )
ORDER BY tablename;

-- Check indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'stations', 'fuel_prices', 'reservations', 
    'notifications', 'queue_reports', 'fuel_analytics', 
    'system_activity', 'reviews', 'payment_transactions'
  )
ORDER BY tablename, indexname;

-- =====================================================
-- INITIAL DATA SETUP COMPLETE!
-- =====================================================
-- Your QuickFuel database now has:
-- ✅ Admin user: admin@quickfuel.com / Admin123!
-- ✅ Fuel prices: Petrol (65 ETB/L), Diesel (58 ETB/L)
-- ✅ All permissions granted
-- ✅ Realtime enabled
-- 
-- Next steps:
-- 1. Login as admin to test authentication
-- 2. Create fuel stations from admin dashboard
-- 3. Register drivers and test the full flow
-- =====================================================
