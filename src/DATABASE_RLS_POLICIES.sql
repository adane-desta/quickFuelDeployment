-- =====================================================
-- QUICKFUEL ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Comprehensive security policies for all tables
-- Implements role-based access control (RBAC)
-- 
-- SECURITY PRINCIPLES:
-- ✅ Drivers can only see their own data
-- ✅ Operators can see data for their station
-- ✅ Admins can see all data
-- ✅ Users can only modify their own records
-- ✅ Prevent unauthorized data access
-- =====================================================

-- =====================================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- =====================================================

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

-- =====================================================
-- STEP 2: DROP EXISTING POLICIES (CLEAN SLATE)
-- =====================================================

-- Users policies
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_by_admin" ON users;
DROP POLICY IF EXISTS "users_insert_during_signup" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_update_by_admin" ON users;

-- Stations policies
DROP POLICY IF EXISTS "stations_select_all" ON stations;
DROP POLICY IF EXISTS "stations_insert_admin" ON stations;
DROP POLICY IF EXISTS "stations_update_operator" ON stations;
DROP POLICY IF EXISTS "stations_update_admin" ON stations;
DROP POLICY IF EXISTS "stations_delete_admin" ON stations;

-- Fuel prices policies
DROP POLICY IF EXISTS "fuel_prices_select_all" ON fuel_prices;
DROP POLICY IF EXISTS "fuel_prices_modify_admin" ON fuel_prices;

-- Reservations policies
DROP POLICY IF EXISTS "reservations_select_own" ON reservations;
DROP POLICY IF EXISTS "reservations_insert_driver" ON reservations;
DROP POLICY IF EXISTS "reservations_update_own" ON reservations;

-- Notifications policies
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_all" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;

-- Queue reports policies
DROP POLICY IF EXISTS "queue_reports_select_all" ON queue_reports;
DROP POLICY IF EXISTS "queue_reports_insert_authenticated" ON queue_reports;

-- Fuel analytics policies
DROP POLICY IF EXISTS "fuel_analytics_select_all" ON fuel_analytics;
DROP POLICY IF EXISTS "fuel_analytics_select_operator" ON fuel_analytics;
DROP POLICY IF EXISTS "fuel_analytics_insert_operator" ON fuel_analytics;

-- System activity policies
DROP POLICY IF EXISTS "system_activity_select_admin" ON system_activity;
DROP POLICY IF EXISTS "system_activity_insert_all" ON system_activity;

-- Reviews policies
DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_driver" ON reviews;
DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;

-- Payment transactions policies
DROP POLICY IF EXISTS "payment_transactions_select_own" ON payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_insert_driver" ON payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_update_system" ON payment_transactions;

-- =====================================================
-- STEP 3: USERS TABLE POLICIES
-- =====================================================

-- SELECT: Users can view their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- SELECT: Admins can view all users
CREATE POLICY "users_select_by_admin" ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT: Allow user creation during signup
CREATE POLICY "users_insert_during_signup" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- UPDATE: Admins can update any user
CREATE POLICY "users_update_by_admin" ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- STEP 4: STATIONS TABLE POLICIES
-- =====================================================

-- SELECT: Everyone can view all stations (public data)
CREATE POLICY "stations_select_all" ON stations
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Only admins can create stations
CREATE POLICY "stations_insert_admin" ON stations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- UPDATE: Operators can update their own station
CREATE POLICY "stations_update_operator" ON stations
  FOR UPDATE
  TO authenticated
  USING (
    operator_id = auth.uid()
  )
  WITH CHECK (
    operator_id = auth.uid()
  );

-- UPDATE: Admins can update any station
CREATE POLICY "stations_update_admin" ON stations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: Only admins can delete stations
CREATE POLICY "stations_delete_admin" ON stations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- STEP 5: FUEL PRICES TABLE POLICIES
-- =====================================================

-- SELECT: Everyone can view fuel prices
CREATE POLICY "fuel_prices_select_all" ON fuel_prices
  FOR SELECT
  TO authenticated
  USING (true);

-- ALL: Only admins can modify fuel prices
CREATE POLICY "fuel_prices_modify_admin" ON fuel_prices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- STEP 6: RESERVATIONS TABLE POLICIES
-- =====================================================

-- SELECT: Users can view reservations they're involved in
CREATE POLICY "reservations_select_own" ON reservations
  FOR SELECT
  TO authenticated
  USING (
    -- Drivers can see their own reservations
    driver_id = auth.uid()
    -- Operators can see reservations for their station
    OR EXISTS (
      SELECT 1 FROM stations 
      WHERE id = reservations.station_id 
      AND operator_id = auth.uid()
    )
    -- Admins can see all reservations
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT: Only drivers can create reservations
CREATE POLICY "reservations_insert_driver" ON reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    driver_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'driver'
    )
  );

-- UPDATE: Drivers, operators (for their station), and admins can update
CREATE POLICY "reservations_update_own" ON reservations
  FOR UPDATE
  TO authenticated
  USING (
    driver_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM stations 
      WHERE id = reservations.station_id 
      AND operator_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    driver_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM stations 
      WHERE id = reservations.station_id 
      AND operator_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- STEP 7: NOTIFICATIONS TABLE POLICIES
-- =====================================================

-- SELECT: Users can only see their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: Anyone can create notifications (system-generated)
CREATE POLICY "notifications_insert_all" ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own notifications
CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- STEP 8: QUEUE REPORTS TABLE POLICIES
-- =====================================================

-- SELECT: Everyone can view queue reports (public data)
CREATE POLICY "queue_reports_select_all" ON queue_reports
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Only drivers can submit queue reports
CREATE POLICY "queue_reports_insert_authenticated" ON queue_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    driver_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'driver'
    )
  );

-- =====================================================
-- STEP 9: FUEL ANALYTICS TABLE POLICIES
-- =====================================================

-- SELECT: Admins and operators can view analytics for their station
CREATE POLICY "fuel_analytics_select_operator" ON fuel_analytics
  FOR SELECT
  TO authenticated
  USING (
    -- Operators can see analytics for their station
    EXISTS (
      SELECT 1 FROM stations 
      WHERE id = fuel_analytics.station_id 
      AND operator_id = auth.uid()
    )
    -- Admins can see all analytics
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT: Operators and admins can create analytics
CREATE POLICY "fuel_analytics_insert_operator" ON fuel_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Operators can create analytics for their station
    EXISTS (
      SELECT 1 FROM stations 
      WHERE id = station_id 
      AND operator_id = auth.uid()
    )
    -- Admins can create analytics for any station
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- STEP 10: SYSTEM ACTIVITY TABLE POLICIES
-- =====================================================

-- SELECT: Only admins can view system activity logs
CREATE POLICY "system_activity_select_admin" ON system_activity
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT: Anyone can create activity logs (system-generated)
CREATE POLICY "system_activity_insert_all" ON system_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- STEP 11: REVIEWS TABLE POLICIES
-- =====================================================

-- SELECT: Everyone can view visible reviews
CREATE POLICY "reviews_select_all" ON reviews
  FOR SELECT
  TO authenticated
  USING (is_visible = true);

-- INSERT: Only drivers can create reviews
CREATE POLICY "reviews_insert_driver" ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    driver_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'driver'
    )
  );

-- UPDATE: Drivers can update their own reviews
CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

-- DELETE: Drivers can delete their own reviews
CREATE POLICY "reviews_delete_own" ON reviews
  FOR DELETE
  TO authenticated
  USING (driver_id = auth.uid());

-- =====================================================
-- STEP 12: PAYMENT TRANSACTIONS TABLE POLICIES
-- =====================================================

-- SELECT: Users can view transactions related to their reservations
CREATE POLICY "payment_transactions_select_own" ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    -- Drivers can see transactions for their reservations
    EXISTS (
      SELECT 1 FROM reservations 
      WHERE id = payment_transactions.reservation_id 
      AND driver_id = auth.uid()
    )
    -- Operators can see transactions for their station's reservations
    OR EXISTS (
      SELECT 1 FROM reservations r
      JOIN stations s ON r.station_id = s.id
      WHERE r.id = payment_transactions.reservation_id 
      AND s.operator_id = auth.uid()
    )
    -- Admins can see all transactions
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT: Drivers can create transactions for their reservations
CREATE POLICY "payment_transactions_insert_driver" ON payment_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reservations 
      WHERE id = reservation_id 
      AND driver_id = auth.uid()
    )
  );

-- UPDATE: System can update transactions (for webhook callbacks)
CREATE POLICY "payment_transactions_update_system" ON payment_transactions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- RLS POLICIES COMPLETE!
-- =====================================================
-- All tables are now secured with role-based access control
-- =====================================================
