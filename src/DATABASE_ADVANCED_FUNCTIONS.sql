-- =====================================================
-- QUICKFUEL ADVANCED SYSTEM - FUNCTIONS & TRIGGERS
-- =====================================================
-- Automated business logic and data management
-- =====================================================

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Handle new user creation from Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    INSERT INTO public.users (id, email, full_name, phone, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
      COALESCE(NEW.raw_user_meta_data->>'phone', '+251911000000'),
      COALESCE(NEW.raw_user_meta_data->>'role', 'driver')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TIME SLOT MANAGEMENT
-- =====================================================

-- Function: Calculate slot capacity
CREATE OR REPLACE FUNCTION calculate_slot_capacity(
  p_number_of_pumps INTEGER,
  p_vehicles_per_pump INTEGER
)
RETURNS INTEGER AS $$
BEGIN
  RETURN p_number_of_pumps * p_vehicles_per_pump;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Generate time slots for a station
CREATE OR REPLACE FUNCTION generate_time_slots_for_station(
  p_station_id UUID,
  p_days_ahead INTEGER DEFAULT 7
)
RETURNS INTEGER AS $$
DECLARE
  v_station RECORD;
  v_current_date DATE;
  v_end_date DATE;
  v_current_time TIME;
  v_slot_start TIME;
  v_slot_end TIME;
  v_capacity INTEGER;
  v_slots_created INTEGER := 0;
  v_day_name TEXT;
BEGIN
  -- Get station configuration
  SELECT 
    opening_time, 
    closing_time, 
    is_24_hours,
    number_of_pumps,
    vehicles_per_pump_per_slot,
    operating_days
  INTO v_station
  FROM stations
  WHERE id = p_station_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Station not found or inactive';
  END IF;
  
  -- Calculate capacity
  v_capacity := calculate_slot_capacity(
    v_station.number_of_pumps, 
    v_station.vehicles_per_pump_per_slot
  );
  
  -- Set date range
  v_current_date := CURRENT_DATE;
  v_end_date := CURRENT_DATE + p_days_ahead;
  
  -- Loop through each date
  WHILE v_current_date <= v_end_date LOOP
    -- Get day name
    v_day_name := TO_CHAR(v_current_date, 'Day');
    v_day_name := TRIM(v_day_name);
    
    -- Check if station operates on this day
    IF v_station.operating_days @> to_jsonb(ARRAY[v_day_name]) THEN
      
      -- Generate hourly slots for this day
      IF v_station.is_24_hours THEN
        v_slot_start := '00:00'::TIME;
        v_slot_end := '23:59'::TIME;
      ELSE
        v_slot_start := v_station.opening_time;
        v_slot_end := v_station.closing_time;
      END IF;
      
      v_current_time := v_slot_start;
      
      -- Create hourly slots
      WHILE v_current_time < v_slot_end LOOP
        -- Insert slot if it doesn't exist
        INSERT INTO time_slots (
          station_id,
          slot_date,
          start_time,
          end_time,
          max_capacity,
          current_reservations,
          status
        )
        VALUES (
          p_station_id,
          v_current_date,
          v_current_time,
          LEAST(v_current_time + INTERVAL '1 hour', v_slot_end::INTERVAL)::TIME,
          v_capacity,
          0,
          'available'
        )
        ON CONFLICT (station_id, slot_date, start_time) 
        DO UPDATE SET
          max_capacity = EXCLUDED.max_capacity,
          updated_at = NOW();
        
        v_slots_created := v_slots_created + 1;
        
        -- Move to next hour
        v_current_time := v_current_time + INTERVAL '1 hour';
      END LOOP;
      
    END IF;
    
    -- Move to next date
    v_current_date := v_current_date + 1;
  END LOOP;
  
  RETURN v_slots_created;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_time_slots_for_station IS 'Generates hourly time slots for a station based on operating hours';

-- Function: Update slot status based on capacity
CREATE OR REPLACE FUNCTION update_slot_status(p_slot_id UUID)
RETURNS VOID AS $$
DECLARE
  v_slot RECORD;
BEGIN
  SELECT 
    current_reservations,
    max_capacity
  INTO v_slot
  FROM time_slots
  WHERE id = p_slot_id;
  
  IF FOUND THEN
    UPDATE time_slots
    SET status = CASE
      WHEN current_reservations >= max_capacity THEN 'full'
      WHEN current_reservations::DECIMAL / max_capacity >= 0.75 THEN 'limited'
      ELSE 'available'
    END
    WHERE id = p_slot_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUEL INVENTORY MANAGEMENT
-- =====================================================

-- Function: Update fuel inventory when delivery is approved
CREATE OR REPLACE FUNCTION update_fuel_inventory_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update when status changes from pending to approved
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    
    -- Add fuel to inventory
    UPDATE station_fuel_inventory
    SET 
      current_stock = current_stock + NEW.quantity,
      last_refilled_at = NOW(),
      is_available = (current_stock + NEW.quantity) > minimum_stock_threshold,
      updated_at = NOW()
    WHERE station_id = NEW.station_id
      AND fuel_type_id = NEW.fuel_type_id;
    
    -- Create notification for station owner
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      priority,
      related_id,
      related_type
    )
    SELECT
      s.owner_id,
      'fuel_delivery',
      'Fuel Delivery Completed',
      format('%s liters of %s added to your station inventory', NEW.quantity, ft.name),
      'high',
      NEW.id,
      'delivery'
    FROM stations s
    JOIN fuel_types ft ON ft.id = NEW.fuel_type_id
    WHERE s.id = NEW.station_id;
    
    -- Log activity
    INSERT INTO system_activity (
      user_id,
      user_role,
      action,
      description,
      category,
      success,
      metadata
    ) VALUES (
      NEW.approved_by,
      'admin',
      'FUEL_DELIVERY_COMPLETED',
      format('Fuel delivery completed: %s liters', NEW.quantity),
      'fuel',
      true,
      jsonb_build_object(
        'delivery_id', NEW.id,
        'station_id', NEW.station_id,
        'fuel_type_id', NEW.fuel_type_id,
        'quantity', NEW.quantity
      )
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update fuel inventory when fuel is dispensed
CREATE OR REPLACE FUNCTION update_fuel_inventory_on_dispensing()
RETURNS TRIGGER AS $$
DECLARE
  v_inventory RECORD;
BEGIN
  -- Only process when reservation is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- Reduce fuel stock
    UPDATE station_fuel_inventory
    SET 
      current_stock = current_stock - NEW.quantity,
      updated_at = NOW()
    WHERE station_id = NEW.station_id
      AND fuel_type_id = NEW.fuel_type_id
    RETURNING * INTO v_inventory;
    
    -- Update availability flag
    UPDATE station_fuel_inventory
    SET is_available = (current_stock > minimum_stock_threshold)
    WHERE station_id = NEW.station_id
      AND fuel_type_id = NEW.fuel_type_id;
    
    -- Create dispensing log
    INSERT INTO fuel_dispensing_logs (
      reservation_id,
      station_id,
      fuel_type_id,
      quantity_dispensed,
      price_per_liter,
      total_amount,
      dispensed_by,
      dispensed_at
    ) VALUES (
      NEW.id,
      NEW.station_id,
      NEW.fuel_type_id,
      NEW.quantity,
      NEW.price_per_liter,
      NEW.total_price,
      NEW.dispensed_by,
      NEW.completed_at
    );
    
    -- Check if stock is low and send notification
    IF v_inventory.current_stock <= v_inventory.minimum_stock_threshold THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        priority,
        related_id,
        related_type
      )
      SELECT
        s.owner_id,
        'fuel_low',
        'Low Fuel Stock Alert',
        format('Your %s stock is running low (%s liters remaining)', ft.name, v_inventory.current_stock),
        'urgent',
        s.id,
        'station'
      FROM stations s
      JOIN fuel_types ft ON ft.id = NEW.fuel_type_id
      WHERE s.id = NEW.station_id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RESERVATION MANAGEMENT
-- =====================================================

-- Function: Generate unique pickup code
CREATE OR REPLACE FUNCTION generate_pickup_code()
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-digit numeric code
    v_code := LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM reservations WHERE pickup_code = v_code) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate reservation expiration time
CREATE OR REPLACE FUNCTION calculate_reservation_expiration(
  p_slot_date DATE,
  p_slot_end_time TIME
)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  -- Expiration = slot end time + 15 minutes grace period
  RETURN (p_slot_date + p_slot_end_time + INTERVAL '15 minutes')::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Update slot capacity when reservation is made/cancelled
CREATE OR REPLACE FUNCTION update_slot_capacity_on_reservation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment reservation count
    UPDATE time_slots
    SET current_reservations = current_reservations + 1
    WHERE id = NEW.time_slot_id;
    
    -- Update slot status
    PERFORM update_slot_status(NEW.time_slot_id);
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- If status changed to cancelled or expired, decrement count
    IF NEW.status IN ('cancelled', 'expired') AND OLD.status NOT IN ('cancelled', 'expired') THEN
      UPDATE time_slots
      SET current_reservations = GREATEST(current_reservations - 1, 0)
      WHERE id = NEW.time_slot_id;
      
      -- Update slot status
      PERFORM update_slot_status(NEW.time_slot_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Check and expire old reservations
CREATE OR REPLACE FUNCTION check_reservation_expiration()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  -- Mark expired reservations
  UPDATE reservations
  SET 
    status = 'expired',
    expired_at = NOW()
  WHERE status IN ('confirmed', 'arrived')
    AND expires_at < NOW()
    AND status != 'expired'
  RETURNING * INTO v_expired_count;
  
  RETURN COALESCE(v_expired_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function: Send reservation notifications
CREATE OR REPLACE FUNCTION send_reservation_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_priority TEXT := 'normal';
BEGIN
  -- Determine notification based on status change
  IF NEW.status != OLD.status THEN
    CASE NEW.status
      WHEN 'confirmed' THEN
        v_title := 'Reservation Confirmed';
        v_message := format('Your reservation is confirmed! Pickup code: %s', NEW.pickup_code);
        v_priority := 'high';
        
      WHEN 'arrived' THEN
        v_title := 'Arrival Confirmed';
        v_message := 'You have been marked as arrived. Please proceed to the designated pump.';
        v_priority := 'high';
        
      WHEN 'dispensing' THEN
        v_title := 'Fuel Dispensing Started';
        v_message := 'Your fuel dispensing is in progress.';
        
      WHEN 'completed' THEN
        v_title := 'Reservation Completed';
        v_message := 'Your fuel has been dispensed. Thank you for using QuickFuel!';
        v_priority := 'high';
        
      WHEN 'cancelled' THEN
        v_title := 'Reservation Cancelled';
        v_message := COALESCE('Reason: ' || NEW.cancellation_reason, 'Your reservation has been cancelled.');
        
      WHEN 'expired' THEN
        v_title := 'Reservation Expired';
        v_message := 'Your reservation has expired due to no-show.';
        v_priority := 'urgent';
        
      ELSE
        RETURN NEW;
    END CASE;
    
    -- Create notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      priority,
      related_id,
      related_type
    ) VALUES (
      NEW.driver_id,
      'reservation',
      v_title,
      v_message,
      v_priority,
      NEW.id,
      'reservation'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STATION MANAGEMENT
-- =====================================================

-- Function: Auto-generate slots when station is created/updated
CREATE OR REPLACE FUNCTION auto_generate_slots_on_station_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If station is newly verified and active, generate slots
  IF NEW.is_verified = true AND NEW.is_active = true THEN
    IF TG_OP = 'INSERT' OR (NEW.is_verified != OLD.is_verified OR NEW.is_active != OLD.is_active) THEN
      PERFORM generate_time_slots_for_station(NEW.id, 14); -- Generate 14 days ahead
    END IF;
    
    -- If operating hours changed, regenerate future slots
    IF TG_OP = 'UPDATE' AND (
      NEW.opening_time != OLD.opening_time OR 
      NEW.closing_time != OLD.closing_time OR
      NEW.number_of_pumps != OLD.number_of_pumps OR
      NEW.vehicles_per_pump_per_slot != OLD.vehicles_per_pump_per_slot OR
      NEW.operating_days::text != OLD.operating_days::text
    ) THEN
      -- Delete future slots (from tomorrow onwards)
      DELETE FROM time_slots
      WHERE station_id = NEW.id
        AND slot_date > CURRENT_DATE;
      
      -- Regenerate
      PERFORM generate_time_slots_for_station(NEW.id, 14);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Updated_at triggers
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

CREATE TRIGGER update_fuel_types_updated_at
  BEFORE UPDATE ON fuel_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_station_fuel_inventory_updated_at
  BEFORE UPDATE ON station_fuel_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fuel_deliveries_updated_at
  BEFORE UPDATE ON fuel_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auth trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Fuel inventory triggers
CREATE TRIGGER on_fuel_delivery_status_change
  AFTER UPDATE ON fuel_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_fuel_inventory_on_delivery();

CREATE TRIGGER on_reservation_fuel_dispensed
  AFTER UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_fuel_inventory_on_dispensing();

-- Reservation triggers
CREATE TRIGGER on_reservation_slot_update
  AFTER INSERT OR UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_slot_capacity_on_reservation();

CREATE TRIGGER on_reservation_status_change
  AFTER UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION send_reservation_notification();

-- Station triggers
CREATE TRIGGER on_station_created_or_updated
  AFTER INSERT OR UPDATE ON stations
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_slots_on_station_change();

-- =====================================================
-- UTILITY FUNCTIONS FOR QUERIES
-- =====================================================

-- Function: Get available time slots for a station and date
CREATE OR REPLACE FUNCTION get_available_time_slots(
  p_station_id UUID,
  p_date DATE
)
RETURNS TABLE (
  slot_id UUID,
  start_time TIME,
  end_time TIME,
  max_capacity INTEGER,
  current_reservations INTEGER,
  available_spots INTEGER,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id,
    ts.start_time,
    ts.end_time,
    ts.max_capacity,
    ts.current_reservations,
    (ts.max_capacity - ts.current_reservations) as available_spots,
    ts.status
  FROM time_slots ts
  WHERE ts.station_id = p_station_id
    AND ts.slot_date = p_date
    AND ts.status IN ('available', 'limited')
  ORDER BY ts.start_time;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_available_time_slots IS 'Returns available time slots for a station on a specific date';

-- Function: Get station fuel inventory with prices
CREATE OR REPLACE FUNCTION get_station_fuel_inventory(p_station_id UUID)
RETURNS TABLE (
  fuel_type_name TEXT,
  fuel_type_code TEXT,
  current_stock DECIMAL,
  is_available BOOLEAN,
  price_per_liter DECIMAL,
  stock_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ft.name,
    ft.code,
    sfi.current_stock,
    sfi.is_available,
    COALESCE(sfi.custom_price_per_liter, ft.base_price_per_liter) as price,
    CASE 
      WHEN sfi.current_stock <= sfi.minimum_stock_threshold THEN 'low'
      WHEN sfi.current_stock > sfi.minimum_stock_threshold * 2 THEN 'good'
      ELSE 'moderate'
    END as stock_status
  FROM station_fuel_inventory sfi
  JOIN fuel_types ft ON sfi.fuel_type_id = ft.id
  WHERE sfi.station_id = p_station_id
  ORDER BY ft.name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SCHEDULED JOBS (Run via pg_cron or external scheduler)
-- =====================================================

-- Function to run daily maintenance
CREATE OR REPLACE FUNCTION daily_maintenance()
RETURNS VOID AS $$
BEGIN
  -- Expire old reservations
  PERFORM check_reservation_expiration();
  
  -- Generate slots for all active stations (14 days ahead)
  PERFORM generate_time_slots_for_station(id, 14)
  FROM stations
  WHERE is_active = true AND is_verified = true;
  
  -- Clean up old notifications (>30 days)
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND is_read = true;
  
  -- Log maintenance
  INSERT INTO system_activity (
    action,
    description,
    category,
    success
  ) VALUES (
    'DAILY_MAINTENANCE',
    'Automated daily maintenance completed',
    'system',
    true
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTIONS & TRIGGERS COMPLETE!
-- =====================================================
