-- =====================================================
-- QUICKFUEL COMPLETE DATABASE SETUP
-- =====================================================
-- This script creates ALL tables, policies, functions, triggers
-- and inserts initial data for a fully functional system
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Drop existing tables and policies (clean slate)
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
DROP TRIGGER IF EXISTS update_stations_updated_at ON stations;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS system_activity CASCADE;
DROP TABLE IF EXISTS queue_reports CASCADE;
DROP TABLE IF EXISTS fuel_analytics CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS fuel_prices CASCADE;
DROP TABLE IF EXISTS stations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 2: Create Tables
-- =====================================================

-- Users Table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'driver', 'operator')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Driver-specific fields
  address TEXT,
  vehicle_model TEXT,
  plate_number TEXT,
  preferred_fuel_type TEXT CHECK (preferred_fuel_type IN ('Petrol', 'Diesel', NULL)),
  license_number TEXT,
  
  -- Operator-specific fields
  station_id UUID,
  
  -- Admin-specific fields
  employee_id TEXT,
  department TEXT
);

-- Stations Table
CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  operating_hours TEXT DEFAULT '24/7',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  operator_id UUID REFERENCES users(id),
  petrol_stock DECIMAL(10, 2) DEFAULT 0,
  diesel_stock DECIMAL(10, 2) DEFAULT 0,
  petrol_available BOOLEAN DEFAULT false,
  diesel_available BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fuel Prices Table (system-wide prices)
CREATE TABLE fuel_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuel_type TEXT NOT NULL UNIQUE CHECK (fuel_type IN ('Petrol', 'Diesel')),
  price_per_liter DECIMAL(10, 2) NOT NULL CHECK (price_per_liter > 0),
  effective_from DATE NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations Table
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('Petrol', 'Diesel')),
  quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('Telebirr', 'Chapa', NULL)),
  transaction_id TEXT UNIQUE,
  pickup_code TEXT UNIQUE,
  qr_code TEXT,
  scheduled_time TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reservation', 'price_change', 'station_update', 'system', 'promotion')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Queue Reports Table
CREATE TABLE queue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  queue_length INTEGER NOT NULL CHECK (queue_length >= 0),
  wait_time_minutes INTEGER NOT NULL CHECK (wait_time_minutes >= 0),
  reported_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fuel Analytics Table (for tracking dispensing and stock levels)
CREATE TABLE fuel_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('Petrol', 'Diesel')),
  quantity_dispensed DECIMAL(10, 2) NOT NULL CHECK (quantity_dispensed >= 0),
  revenue DECIMAL(10, 2) NOT NULL CHECK (revenue >= 0),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_by UUID REFERENCES users(id)
);

-- System Activity Table (audit log)
CREATE TABLE system_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_role TEXT,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  ip_address TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Transactions Table
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Telebirr', 'Chapa')),
  transaction_reference TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Step 3: Create Indexes for Performance
-- =====================================================

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_plate_number ON users(plate_number);

CREATE INDEX idx_stations_operator ON stations(operator_id);
CREATE INDEX idx_stations_location ON stations(latitude, longitude);
CREATE INDEX idx_stations_verified ON stations(is_verified);
CREATE INDEX idx_stations_petrol_available ON stations(petrol_available);
CREATE INDEX idx_stations_diesel_available ON stations(diesel_available);

CREATE INDEX idx_reservations_driver ON reservations(driver_id);
CREATE INDEX idx_reservations_station ON reservations(station_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_payment_status ON reservations(payment_status);
CREATE INDEX idx_reservations_pickup_code ON reservations(pickup_code);
CREATE INDEX idx_reservations_created_at ON reservations(created_at DESC);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX idx_queue_reports_station ON queue_reports(station_id);
CREATE INDEX idx_queue_reports_reported_at ON queue_reports(reported_at DESC);

CREATE INDEX idx_fuel_analytics_station ON fuel_analytics(station_id);
CREATE INDEX idx_fuel_analytics_recorded_at ON fuel_analytics(recorded_at DESC);

CREATE INDEX idx_system_activity_user ON system_activity(user_id);
CREATE INDEX idx_system_activity_created_at ON system_activity(created_at DESC);

CREATE INDEX idx_reviews_station ON reviews(station_id);
CREATE INDEX idx_reviews_driver ON reviews(driver_id);

CREATE INDEX idx_payment_transactions_reservation ON payment_transactions(reservation_id);
CREATE INDEX idx_payment_transactions_reference ON payment_transactions(transaction_reference);

-- Step 4: Create Functions and Triggers
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stations_updated_at
  BEFORE UPDATE ON stations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation from auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if it doesn't exist (to avoid conflicts)
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.id) THEN
    INSERT INTO users (id, email, full_name, phone, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
      COALESCE(NEW.raw_user_meta_data->>'phone', '+251900000000'),
      COALESCE(NEW.raw_user_meta_data->>'role', 'driver')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new auth users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 5: Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users Table Policies
CREATE POLICY "users_select_own" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_during_signup" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Stations Table Policies (everyone can view, operators can update their own)
CREATE POLICY "stations_select_all" ON stations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "stations_insert_admin" ON stations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "stations_update_operator" ON stations
  FOR UPDATE TO authenticated
  USING (operator_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (operator_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Fuel Prices Policies (everyone can view, only admins can modify)
CREATE POLICY "fuel_prices_select_all" ON fuel_prices
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "fuel_prices_modify_admin" ON fuel_prices
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Reservations Policies
CREATE POLICY "reservations_select_own" ON reservations
  FOR SELECT TO authenticated
  USING (
    driver_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM stations WHERE id = reservations.station_id AND operator_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "reservations_insert_driver" ON reservations
  FOR INSERT TO authenticated
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "reservations_update_own" ON reservations
  FOR UPDATE TO authenticated
  USING (
    driver_id = auth.uid()
    OR EXISTS (SELECT 1 FROM stations WHERE id = reservations.station_id AND operator_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    driver_id = auth.uid()
    OR EXISTS (SELECT 1 FROM stations WHERE id = reservations.station_id AND operator_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Notifications Policies
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_all" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Queue Reports Policies (all authenticated users can view and insert)
CREATE POLICY "queue_reports_select_all" ON queue_reports
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "queue_reports_insert_authenticated" ON queue_reports
  FOR INSERT TO authenticated
  WITH CHECK (driver_id = auth.uid());

-- Fuel Analytics Policies
CREATE POLICY "fuel_analytics_select_all" ON fuel_analytics
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "fuel_analytics_insert_operator" ON fuel_analytics
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM stations WHERE id = station_id AND operator_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- System Activity Policies (admins only)
CREATE POLICY "system_activity_select_admin" ON system_activity
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "system_activity_insert_all" ON system_activity
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Reviews Policies
CREATE POLICY "reviews_select_all" ON reviews
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "reviews_insert_driver" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

-- Payment Transactions Policies
CREATE POLICY "payment_transactions_select_own" ON payment_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM reservations WHERE id = reservation_id AND driver_id = auth.uid())
    OR EXISTS (SELECT 1 FROM reservations r JOIN stations s ON r.station_id = s.id WHERE r.id = reservation_id AND s.operator_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "payment_transactions_insert_driver" ON payment_transactions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM reservations WHERE id = reservation_id AND driver_id = auth.uid()));

CREATE POLICY "payment_transactions_update_system" ON payment_transactions
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 6: Insert Initial Data
-- =====================================================

-- Insert Fuel Prices
INSERT INTO fuel_prices (fuel_type, price_per_liter, effective_from, updated_by)
VALUES 
  ('Petrol', 65.00, CURRENT_DATE, 'System'),
  ('Diesel', 58.00, CURRENT_DATE, 'System')
ON CONFLICT (fuel_type) DO UPDATE SET
  price_per_liter = EXCLUDED.price_per_liter,
  updated_at = NOW();

-- Create Admin User (if doesn't exist)
DO $$
DECLARE
  admin_uuid UUID;
  admin_exists BOOLEAN;
BEGIN
  -- Check if admin already exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@quickfuel.com') INTO admin_exists;
  
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

    -- Create user profile
    INSERT INTO users (id, email, full_name, phone, role, employee_id, department)
    VALUES (
      admin_uuid,
      'admin@quickfuel.com',
      'System Administrator',
      '+251911000000',
      'admin',
      'EMP001',
      'System Administration'
    );

    RAISE NOTICE 'Admin user created with ID: %', admin_uuid;
  ELSE
    -- Update existing admin to ensure email is confirmed
    UPDATE auth.users 
    SET email_confirmed_at = NOW(), confirmed_at = NOW()
    WHERE email = 'admin@quickfuel.com';
    
    RAISE NOTICE 'Admin user already exists - email confirmation updated';
  END IF;
END $$;

-- Step 7: Grant Permissions
-- =====================================================

-- Grant access to authenticated users
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
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 8: Enable Realtime (for live updates)
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE stations;
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE queue_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE fuel_prices;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify everything is set up correctly

-- Verify admin user
SELECT id, email, email_confirmed_at, confirmed_at FROM auth.users WHERE email = 'admin@quickfuel.com';

-- Verify user profile
SELECT id, email, full_name, role FROM users WHERE role = 'admin';

-- Verify fuel prices
SELECT fuel_type, price_per_liter, effective_from FROM fuel_prices ORDER BY fuel_type;

-- Count tables
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'stations', COUNT(*) FROM stations
UNION ALL
SELECT 'fuel_prices', COUNT(*) FROM fuel_prices
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Your QuickFuel database is now ready to use!
-- 
-- Next steps:
-- 1. Login as admin: admin@quickfuel.com / Admin123!
-- 2. Add fuel stations from admin dashboard
-- 3. Register drivers from the app
-- 4. Test reservations flow
--
-- Important: To add stations, you'll need to use the regular
-- Supabase signup API (not admin.createUser) from the frontend
-- =====================================================
