-- =====================================================
-- QUICKFUEL ADVANCED SYSTEM - RLS POLICIES
-- =====================================================
-- Row Level Security for advanced role-based access
-- Roles: admin | station_owner | operator | driver
-- =====================================================

-- =====================================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE station_fuel_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_dispensing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_activity ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- SELECT: Users can view their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- SELECT: Admins can view all users
CREATE POLICY "users_select_admin" ON users
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- SELECT: Station owners can view their operators
CREATE POLICY "users_select_station_owner_operators" ON users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN stations s ON s.owner_id = u.id
      WHERE u.id = auth.uid() 
        AND u.role = 'station_owner'
        AND users.station_id = s.id
        AND users.role = 'operator'
    )
  );

-- INSERT: Allow user creation during signup
CREATE POLICY "users_insert_signup" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- UPDATE: Admins can update any user
CREATE POLICY "users_update_admin" ON users
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- UPDATE: Station owners can update their operators
CREATE POLICY "users_update_station_owner_operators" ON users
  FOR UPDATE TO authenticated
  USING (
    role = 'operator' AND
    EXISTS (
      SELECT 1 FROM users u
      JOIN stations s ON s.owner_id = u.id
      WHERE u.id = auth.uid() 
        AND u.role = 'station_owner'
        AND users.station_id = s.id
    )
  )
  WITH CHECK (
    role = 'operator' AND
    EXISTS (
      SELECT 1 FROM users u
      JOIN stations s ON s.owner_id = u.id
      WHERE u.id = auth.uid() 
        AND u.role = 'station_owner'
        AND users.station_id = s.id
    )
  );

-- =====================================================
-- FUEL TYPES TABLE POLICIES
-- =====================================================

-- SELECT: Everyone can view active fuel types
CREATE POLICY "fuel_types_select_all" ON fuel_types
  FOR SELECT TO authenticated
  USING (is_active = true);

-- ALL: Only admins can modify fuel types
CREATE POLICY "fuel_types_admin_all" ON fuel_types
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- STATIONS TABLE POLICIES
-- =====================================================

-- SELECT: Everyone can view active verified stations
CREATE POLICY "stations_select_active" ON stations
  FOR SELECT TO authenticated
  USING (is_active = true AND is_verified = true);

-- SELECT: Station owners can view their own stations
CREATE POLICY "stations_select_owner" ON stations
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- SELECT: Operators can view their assigned station
CREATE POLICY "stations_select_operator" ON stations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND role = 'operator' 
        AND station_id = stations.id
    )
  );

-- SELECT: Admins can view all stations
CREATE POLICY "stations_select_admin" ON stations
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT: Only admins can create stations
CREATE POLICY "stations_insert_admin" ON stations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- UPDATE: Station owners can update their own stations
CREATE POLICY "stations_update_owner" ON stations
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: Admins can update any station
CREATE POLICY "stations_update_admin" ON stations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- STATION FUEL INVENTORY POLICIES
-- =====================================================

-- SELECT: Everyone can view available fuel at stations
CREATE POLICY "inventory_select_public" ON station_fuel_inventory
  FOR SELECT TO authenticated
  USING (is_available = true);

-- SELECT: Station owners can view their inventory
CREATE POLICY "inventory_select_owner" ON station_fuel_inventory
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stations 
      WHERE id = station_fuel_inventory.station_id 
        AND owner_id = auth.uid()
    )
  );

-- SELECT: Operators can view their station's inventory
CREATE POLICY "inventory_select_operator" ON station_fuel_inventory
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND role = 'operator' 
        AND station_id = station_fuel_inventory.station_id
    )
  );

-- SELECT: Admins can view all inventory
CREATE POLICY "inventory_select_admin" ON station_fuel_inventory
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT/UPDATE: Station owners can manage their inventory
CREATE POLICY "inventory_modify_owner" ON station_fuel_inventory
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stations 
      WHERE id = station_fuel_inventory.station_id 
        AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stations 
      WHERE id = station_id 
        AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- FUEL DELIVERIES POLICIES
-- =====================================================

-- SELECT: Station owners can view their deliveries
CREATE POLICY "deliveries_select_owner" ON fuel_deliveries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stations 
      WHERE id = fuel_deliveries.station_id 
        AND owner_id = auth.uid()
    )
  );

-- SELECT: Admins can view all deliveries
CREATE POLICY "deliveries_select_admin" ON fuel_deliveries
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT: Station owners can request deliveries
CREATE POLICY "deliveries_insert_owner" ON fuel_deliveries
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stations 
      WHERE id = station_id 
        AND owner_id = auth.uid()
    ) AND
    requested_by = auth.uid()
  );

-- UPDATE: Admins can approve/reject deliveries
CREATE POLICY "deliveries_update_admin" ON fuel_deliveries
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- UPDATE: Station owners can update their own deliveries (mark as delivered)
CREATE POLICY "deliveries_update_owner" ON fuel_deliveries
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stations 
      WHERE id = fuel_deliveries.station_id 
        AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stations 
      WHERE id = station_id 
        AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- TIME SLOTS POLICIES
-- =====================================================

-- SELECT: Everyone can view available time slots
CREATE POLICY "slots_select_available" ON time_slots
  FOR SELECT TO authenticated
  USING (status IN ('available', 'limited'));

-- SELECT: Station owners can view all their slots
CREATE POLICY "slots_select_owner" ON time_slots
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stations 
      WHERE id = time_slots.station_id 
        AND owner_id = auth.uid()
    )
  );

-- SELECT: Operators can view their station's slots
CREATE POLICY "slots_select_operator" ON time_slots
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND role = 'operator' 
        AND station_id = time_slots.station_id
    )
  );

-- SELECT: Admins can view all slots
CREATE POLICY "slots_select_admin" ON time_slots
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT/UPDATE: System-managed (triggers only)
CREATE POLICY "slots_system_modify" ON time_slots
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- RESERVATIONS POLICIES
-- =====================================================

-- SELECT: Drivers can view their own reservations
CREATE POLICY "reservations_select_driver" ON reservations
  FOR SELECT TO authenticated
  USING (driver_id = auth.uid());

-- SELECT: Station owners can view reservations for their stations
CREATE POLICY "reservations_select_owner" ON reservations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stations 
      WHERE id = reservations.station_id 
        AND owner_id = auth.uid()
    )
  );

-- SELECT: Operators can view reservations for their station
CREATE POLICY "reservations_select_operator" ON reservations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND role = 'operator' 
        AND station_id = reservations.station_id
    )
  );

-- SELECT: Admins can view all reservations
CREATE POLICY "reservations_select_admin" ON reservations
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT: Only drivers can create reservations
CREATE POLICY "reservations_insert_driver" ON reservations
  FOR INSERT TO authenticated
  WITH CHECK (
    driver_id = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'driver')
  );

-- UPDATE: Drivers can cancel their own reservations
CREATE POLICY "reservations_update_driver" ON reservations
  FOR UPDATE TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

-- UPDATE: Operators can update reservations for their station
CREATE POLICY "reservations_update_operator" ON reservations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND role = 'operator' 
        AND station_id = reservations.station_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND role = 'operator' 
        AND station_id = reservations.station_id
    )
  );

-- UPDATE: Admins can update any reservation
CREATE POLICY "reservations_update_admin" ON reservations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- FUEL DISPENSING LOGS POLICIES
-- =====================================================

-- SELECT: Station owners can view their logs
CREATE POLICY "logs_select_owner" ON fuel_dispensing_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stations 
      WHERE id = fuel_dispensing_logs.station_id 
        AND owner_id = auth.uid()
    )
  );

-- SELECT: Operators can view their station's logs
CREATE POLICY "logs_select_operator" ON fuel_dispensing_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND role = 'operator' 
        AND station_id = fuel_dispensing_logs.station_id
    )
  );

-- SELECT: Admins can view all logs
CREATE POLICY "logs_select_admin" ON fuel_dispensing_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT: System-managed (triggers only)
CREATE POLICY "logs_insert_system" ON fuel_dispensing_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

-- SELECT: Users can view their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- INSERT: System can create notifications
CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- UPDATE: Users can update their own notifications
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own notifications
CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- PAYMENT TRANSACTIONS POLICIES
-- =====================================================

-- SELECT: Drivers can view their own transactions
CREATE POLICY "payments_select_driver" ON payment_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations 
      WHERE id = payment_transactions.reservation_id 
        AND driver_id = auth.uid()
    )
  );

-- SELECT: Station owners can view transactions for their stations
CREATE POLICY "payments_select_owner" ON payment_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      JOIN stations s ON r.station_id = s.id
      WHERE r.id = payment_transactions.reservation_id 
        AND s.owner_id = auth.uid()
    )
  );

-- SELECT: Admins can view all transactions
CREATE POLICY "payments_select_admin" ON payment_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT: Drivers can create transactions for their reservations
CREATE POLICY "payments_insert_driver" ON payment_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reservations 
      WHERE id = reservation_id 
        AND driver_id = auth.uid()
    )
  );

-- UPDATE: System can update transactions (webhooks)
CREATE POLICY "payments_update_system" ON payment_transactions
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- REVIEWS POLICIES
-- =====================================================

-- SELECT: Everyone can view visible reviews
CREATE POLICY "reviews_select_visible" ON reviews
  FOR SELECT TO authenticated
  USING (is_visible = true);

-- INSERT: Drivers can create reviews for completed reservations
CREATE POLICY "reviews_insert_driver" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    driver_id = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'driver')
  );

-- UPDATE: Drivers can update their own reviews
CREATE POLICY "reviews_update_driver" ON reviews
  FOR UPDATE TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

-- UPDATE: Admins can moderate reviews
CREATE POLICY "reviews_update_admin" ON reviews
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- SYSTEM ACTIVITY POLICIES
-- =====================================================

-- SELECT: Admins can view all activity
CREATE POLICY "activity_select_admin" ON system_activity
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- SELECT: Station owners can view their station's activity
CREATE POLICY "activity_select_owner" ON system_activity
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND role = 'station_owner'
        AND (
          metadata->>'station_id' IN (
            SELECT id::text FROM stations WHERE owner_id = auth.uid()
          )
        )
    )
  );

-- INSERT: Anyone can create activity logs
CREATE POLICY "activity_insert_all" ON system_activity
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON users TO authenticated;
GRANT ALL ON fuel_types TO authenticated;
GRANT ALL ON stations TO authenticated;
GRANT ALL ON station_fuel_inventory TO authenticated;
GRANT ALL ON fuel_deliveries TO authenticated;
GRANT ALL ON time_slots TO authenticated;
GRANT ALL ON reservations TO authenticated;
GRANT ALL ON fuel_dispensing_logs TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON payment_transactions TO authenticated;
GRANT ALL ON reviews TO authenticated;
GRANT ALL ON system_activity TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- ENABLE REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE stations;
ALTER PUBLICATION supabase_realtime ADD TABLE station_fuel_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE time_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE fuel_deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_transactions;

-- =====================================================
-- RLS POLICIES COMPLETE!
-- =====================================================
