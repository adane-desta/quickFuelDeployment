-- =====================================================
-- QUICKFUEL ADVANCED SYSTEM - INITIAL DATA
-- =====================================================
-- Setup initial fuel types, admin user, and sample data
-- =====================================================

-- =====================================================
-- STEP 1: INSERT FUEL TYPES
-- =====================================================

INSERT INTO fuel_types (name, code, description, base_price_per_liter, color_code, effective_from, updated_by, is_active)
VALUES 
  ('Petrol', 'PET', 'Regular unleaded petrol/gasoline', 65.00, '#FF6B6B', CURRENT_DATE, 'System Administrator', true),
  ('Diesel', 'DIS', 'Regular diesel fuel', 58.00, '#4ECDC4', CURRENT_DATE, 'System Administrator', true),
  ('Benzene', 'BEN', 'High-grade benzene fuel', 72.00, '#95E1D3', CURRENT_DATE, 'System Administrator', true),
  ('Premium Gasoline', 'PRM', 'Premium high-octane gasoline', 78.00, '#F38181', CURRENT_DATE, 'System Administrator', true),
  ('Kerosene', 'KER', 'Kerosene fuel', 52.00, '#AA96DA', CURRENT_DATE, 'System Administrator', true)
ON CONFLICT (code) DO UPDATE SET
  base_price_per_liter = EXCLUDED.base_price_per_liter,
  updated_at = NOW();

-- =====================================================
-- STEP 2: CREATE ADMIN USER
-- =====================================================

DO $$
DECLARE
  admin_uuid UUID;
  admin_exists BOOLEAN;
BEGIN
  -- Check if admin exists
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = 'admin@quickfuel.com'
  ) INTO admin_exists;
  
  IF NOT admin_exists THEN
    -- Create auth user
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

    -- Create welcome notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      priority
    ) VALUES (
      admin_uuid,
      'system',
      'Welcome to QuickFuel Advanced System!',
      'Your administrator account has been created. You now have full control over the QuickFuel platform.',
      'high'
    );

    -- Log creation
    INSERT INTO system_activity (
      user_id,
      user_role,
      action,
      description,
      category,
      success
    ) VALUES (
      admin_uuid,
      'admin',
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
    -- Update existing admin
    UPDATE auth.users 
    SET 
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmed_at = COALESCE(confirmed_at, NOW())
    WHERE email = 'admin@quickfuel.com';
    
    RAISE NOTICE '⚠️  Admin user already exists - email confirmation updated';
  END IF;
END $$;

-- =====================================================
-- STEP 3: CREATE SAMPLE STATION OWNER (OPTIONAL)
-- =====================================================

DO $$
DECLARE
  owner_uuid UUID;
  owner_exists BOOLEAN;
BEGIN
  -- Check if sample owner exists
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = 'owner@quickfuel.com'
  ) INTO owner_exists;
  
  IF NOT owner_exists THEN
    -- Create auth user for station owner
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
      'owner@quickfuel.com',
      crypt('Owner123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Sample Station Owner","phone":"+251922000000","role":"station_owner"}',
      false,
      '',
      '',
      ''
    ) RETURNING id INTO owner_uuid;

    -- Create station owner profile
    INSERT INTO public.users (
      id, 
      email, 
      full_name, 
      phone, 
      role,
      business_license_number,
      tax_identification_number,
      business_address,
      is_active
    ) VALUES (
      owner_uuid,
      'owner@quickfuel.com',
      'Sample Station Owner',
      '+251922000000',
      'station_owner',
      'BL-2024-001',
      'TIN-123456789',
      'Bole Road, Addis Ababa',
      true
    );

    -- Create welcome notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      priority
    ) VALUES (
      owner_uuid,
      'system',
      'Welcome to QuickFuel!',
      'Your station owner account has been created. You can now manage your fuel stations.',
      'high'
    );

    RAISE NOTICE '✅ Sample station owner created!';
    RAISE NOTICE '   Email: owner@quickfuel.com';
    RAISE NOTICE '   Password: Owner123!';
    
  END IF;
END $$;

-- =====================================================
-- STEP 4: CREATE SAMPLE DRIVER (OPTIONAL)
-- =====================================================

DO $$
DECLARE
  driver_uuid UUID;
  driver_exists BOOLEAN;
BEGIN
  -- Check if sample driver exists
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = 'driver@quickfuel.com'
  ) INTO driver_exists;
  
  IF NOT driver_exists THEN
    -- Create auth user for driver
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
      'driver@quickfuel.com',
      crypt('Driver123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Sample Driver","phone":"+251933000000","role":"driver"}',
      false,
      '',
      '',
      ''
    ) RETURNING id INTO driver_uuid;

    -- Create driver profile
    INSERT INTO public.users (
      id, 
      email, 
      full_name, 
      phone, 
      role,
      address,
      vehicle_model,
      plate_number,
      license_number,
      preferred_fuel_type,
      is_active
    ) VALUES (
      driver_uuid,
      'driver@quickfuel.com',
      'Sample Driver',
      '+251933000000',
      'driver',
      'Megenagna, Addis Ababa',
      'Toyota Corolla',
      'AA-3-12345',
      'ETH-DL-123456',
      'Petrol',
      true
    );

    -- Create welcome notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      priority
    ) VALUES (
      driver_uuid,
      'system',
      'Welcome to QuickFuel!',
      'Your driver account has been created. You can now make fuel reservations.',
      'high'
    );

    RAISE NOTICE '✅ Sample driver created!';
    RAISE NOTICE '   Email: driver@quickfuel.com';
    RAISE NOTICE '   Password: Driver123!';
    
  END IF;
END $$;

-- =====================================================
-- STEP 5: CREATE SAMPLE STATION (OPTIONAL - Commented)
-- =====================================================

/*
-- Uncomment to create a sample station with inventory

DO $$
DECLARE
  owner_id UUID;
  station_id UUID;
  petrol_id UUID;
  diesel_id UUID;
BEGIN
  -- Get station owner ID
  SELECT id INTO owner_id FROM users WHERE email = 'owner@quickfuel.com';
  
  -- Get fuel type IDs
  SELECT id INTO petrol_id FROM fuel_types WHERE code = 'PET';
  SELECT id INTO diesel_id FROM fuel_types WHERE code = 'DIS';
  
  IF owner_id IS NOT NULL THEN
    -- Create station
    INSERT INTO stations (
      name,
      address,
      phone,
      latitude,
      longitude,
      owner_id,
      operating_days,
      opening_time,
      closing_time,
      is_24_hours,
      number_of_pumps,
      vehicles_per_pump_per_slot,
      business_license_number,
      operating_license_number,
      is_verified,
      is_active,
      verified_by,
      verification_date,
      amenities
    ) VALUES (
      'QuickFuel Bole Station',
      'Bole Road, Near Edna Mall, Addis Ababa',
      '+251911234567',
      9.0103,
      38.7620,
      owner_id,
      '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]'::jsonb,
      '06:00'::TIME,
      '22:00'::TIME,
      false,
      4,
      2,
      'BL-2024-001',
      'OL-2024-001',
      true,
      true,
      (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
      NOW(),
      '["restroom", "car_wash", "shop", "atm", "wifi"]'::jsonb
    ) RETURNING id INTO station_id;
    
    -- Create fuel inventory for Petrol
    INSERT INTO station_fuel_inventory (
      station_id,
      fuel_type_id,
      current_stock,
      minimum_stock_threshold,
      maximum_capacity,
      is_available
    ) VALUES (
      station_id,
      petrol_id,
      5000.00,
      500.00,
      10000.00,
      true
    );
    
    -- Create fuel inventory for Diesel
    INSERT INTO station_fuel_inventory (
      station_id,
      fuel_type_id,
      current_stock,
      minimum_stock_threshold,
      maximum_capacity,
      is_available
    ) VALUES (
      station_id,
      diesel_id,
      4500.00,
      500.00,
      10000.00,
      true
    );
    
    -- Generate time slots for next 14 days
    PERFORM generate_time_slots_for_station(station_id, 14);
    
    RAISE NOTICE '✅ Sample station created!';
    RAISE NOTICE '   Station ID: %', station_id;
    RAISE NOTICE '   Time slots generated for next 14 days';
    
  END IF;
END $$;
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify admin user
SELECT 
  id, 
  email, 
  email_confirmed_at, 
  confirmed_at 
FROM auth.users 
WHERE email = 'admin@quickfuel.com';

-- Verify user profiles
SELECT 
  id, 
  email, 
  full_name, 
  role,
  is_active
FROM users 
ORDER BY role, created_at;

-- Verify fuel types
SELECT 
  name,
  code,
  base_price_per_liter,
  is_active
FROM fuel_types 
ORDER BY name;

-- Count tables and records
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'fuel_types', COUNT(*) FROM fuel_types
UNION ALL
SELECT 'stations', COUNT(*) FROM stations
UNION ALL
SELECT 'station_fuel_inventory', COUNT(*) FROM station_fuel_inventory
UNION ALL
SELECT 'time_slots', COUNT(*) FROM time_slots
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
ORDER BY table_name;

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY tablename;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Your QuickFuel Advanced System is ready!
-- 
-- Login Credentials:
-- Admin:  admin@quickfuel.com / Admin123!
-- Owner:  owner@quickfuel.com / Owner123! (if created)
-- Driver: driver@quickfuel.com / Driver123! (if created)
--
-- Next Steps:
-- 1. Login as admin
-- 2. Create fuel stations (assign to station owners)
-- 3. Station owners can manage inventory and operators
-- 4. Drivers can make time-slot based reservations
-- 5. Operators verify and dispense fuel
--
-- System Features:
-- ✅ Time-slot based reservations (no physical queue)
-- ✅ Automatic fuel inventory tracking
-- ✅ Fuel delivery approval workflow
-- ✅ Multi-fuel type support (5 types)
-- ✅ Reservation expiration (slot end + 15 min)
-- ✅ Real-time notifications
-- ✅ Comprehensive analytics
-- =====================================================
