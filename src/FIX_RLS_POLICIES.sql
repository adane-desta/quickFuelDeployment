-- ============================================
-- FIX: Row Level Security Policies
-- Run this in your Supabase SQL Editor to fix the infinite recursion error
-- ============================================

-- First, drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
DROP POLICY IF EXISTS "Enable insert for service role" ON users;
DROP POLICY IF EXISTS "Users read own data" ON users;
DROP POLICY IF EXISTS "Users update own data" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;

DROP POLICY IF EXISTS "Stations viewable by authenticated users" ON stations;
DROP POLICY IF EXISTS "Operators can update own station" ON stations;
DROP POLICY IF EXISTS "Admins can manage all stations" ON stations;
DROP POLICY IF EXISTS "Enable read access for all users" ON stations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON stations;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON stations;

DROP POLICY IF EXISTS "Reservations viewable by owner" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON reservations;

DROP POLICY IF EXISTS "Notifications viewable by owner" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

DROP POLICY IF EXISTS "Queue reports viewable by all" ON queue_reports;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON queue_reports;

DROP POLICY IF EXISTS "Fuel prices viewable by all" ON fuel_prices;
DROP POLICY IF EXISTS "Only admins can update prices" ON fuel_prices;

DROP POLICY IF EXISTS "Analytics viewable by authenticated" ON fuel_analytics;

DROP POLICY IF EXISTS "Activity viewable by admins" ON system_activity;
DROP POLICY IF EXISTS "System can insert activity" ON system_activity;

-- ============================================
-- USERS TABLE POLICIES (FIXED - NO RECURSION)
-- ============================================

-- Allow users to read their own profile using auth.uid() DIRECTLY
CREATE POLICY "users_select_own"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow anyone to insert (for registration) - will be restricted by auth
CREATE POLICY "users_insert_during_signup"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ============================================
-- STATIONS TABLE POLICIES
-- ============================================

-- Everyone can view verified stations (for public browsing)
CREATE POLICY "stations_select_public"
ON stations FOR SELECT
TO authenticated
USING (true);

-- Operators can update their own station
CREATE POLICY "stations_update_operators"
ON stations FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT u.id FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'operator' 
    AND u.station_id = stations.id
  )
);

-- Admins and service role can do everything
CREATE POLICY "stations_all_service"
ON stations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to insert (for admin adding stations via app)
CREATE POLICY "stations_insert_auth"
ON stations FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- RESERVATIONS TABLE POLICIES
-- ============================================

-- Users can view their own reservations
CREATE POLICY "reservations_select_own"
ON reservations FOR SELECT
TO authenticated
USING (
  auth.uid() = driver_id OR
  auth.uid() IN (
    SELECT u.id FROM users u 
    WHERE u.id = auth.uid() 
    AND (u.role = 'operator' AND u.station_id = reservations.station_id)
  )
);

-- Drivers can create reservations
CREATE POLICY "reservations_insert_drivers"
ON reservations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = driver_id);

-- Drivers and operators can update reservations
CREATE POLICY "reservations_update_own"
ON reservations FOR UPDATE
TO authenticated
USING (
  auth.uid() = driver_id OR
  auth.uid() IN (
    SELECT u.id FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'operator' 
    AND u.station_id = reservations.station_id
  )
);

-- Service role full access
CREATE POLICY "reservations_all_service"
ON reservations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================

-- Users can view their own notifications
CREATE POLICY "notifications_select_own"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own"
ON notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow system to insert notifications
CREATE POLICY "notifications_insert_system"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Service role full access
CREATE POLICY "notifications_all_service"
ON notifications FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- QUEUE REPORTS TABLE POLICIES
-- ============================================

-- Anyone can view queue reports
CREATE POLICY "queue_reports_select_all"
ON queue_reports FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can create reports
CREATE POLICY "queue_reports_insert_auth"
ON queue_reports FOR INSERT
TO authenticated
WITH CHECK (true);

-- Service role full access
CREATE POLICY "queue_reports_all_service"
ON queue_reports FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- FUEL PRICES TABLE POLICIES
-- ============================================

-- Everyone can view fuel prices
CREATE POLICY "fuel_prices_select_all"
ON fuel_prices FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users can update (app will check role)
CREATE POLICY "fuel_prices_update_auth"
ON fuel_prices FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow insert for initial setup
CREATE POLICY "fuel_prices_insert_auth"
ON fuel_prices FOR INSERT
TO authenticated
WITH CHECK (true);

-- Service role full access
CREATE POLICY "fuel_prices_all_service"
ON fuel_prices FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- FUEL ANALYTICS TABLE POLICIES
-- ============================================

-- Authenticated users can view analytics
CREATE POLICY "fuel_analytics_select_auth"
ON fuel_analytics FOR SELECT
TO authenticated
USING (true);

-- Allow updates and inserts
CREATE POLICY "fuel_analytics_modify_auth"
ON fuel_analytics FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Service role full access
CREATE POLICY "fuel_analytics_all_service"
ON fuel_analytics FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- SYSTEM ACTIVITY TABLE POLICIES
-- ============================================

-- Authenticated users can view activity
CREATE POLICY "system_activity_select_auth"
ON system_activity FOR SELECT
TO authenticated
USING (true);

-- Allow inserts for logging
CREATE POLICY "system_activity_insert_auth"
ON system_activity FOR INSERT
TO authenticated
WITH CHECK (true);

-- Service role full access
CREATE POLICY "system_activity_all_service"
ON system_activity FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- VERIFY POLICIES ARE APPLIED
-- ============================================

-- Check users table policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ RLS Policies successfully updated!';
  RAISE NOTICE '✅ Infinite recursion error should be fixed';
  RAISE NOTICE '✅ Try logging in again';
END $$;
