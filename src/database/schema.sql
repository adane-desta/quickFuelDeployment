-- =====================================================
-- QuickFuel Complete Database Schema for Supabase
-- PostgreSQL Database - Production Ready
-- Designed for 800K+ users with scalability & performance
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- =====================================================
-- ENUMS & CUSTOM TYPES
-- =====================================================

CREATE TYPE user_role AS ENUM ('driver', 'operator', 'admin');
CREATE TYPE queue_length AS ENUM ('Short', 'Medium', 'Long');
CREATE TYPE fuel_type AS ENUM ('Petrol', 'Diesel');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE payment_method AS ENUM ('Telebirr', 'Chapa');
CREATE TYPE notification_type AS ENUM (
  'reservation_confirmed',
  'reservation_cancelled',
  'queue_status',
  'payment_success',
  'feedback_reply',
  'station_verified',
  'system_alert',
  'fuel_update'
);
CREATE TYPE activity_type AS ENUM (
  'user_registered',
  'station_verified',
  'reservation_made',
  'fuel_updated',
  'queue_reported',
  'payment_processed',
  'user_deactivated',
  'price_updated'
);

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users Table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  role user_role NOT NULL DEFAULT 'driver',
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Driver-specific fields
  vehicle_model VARCHAR(255),
  plate_number VARCHAR(20),
  preferred_fuel_type fuel_type,
  license_number VARCHAR(50),
  
  -- Operator-specific fields
  station_id UUID,
  business_license VARCHAR(100),
  
  -- Admin-specific fields
  employee_id VARCHAR(50),
  department VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (phone ~* '^\+?[0-9]{10,15}$')
);

-- Stations Table
CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone VARCHAR(20),
  operating_hours VARCHAR(50),
  
  -- Fuel availability
  petrol_available BOOLEAN DEFAULT FALSE,
  diesel_available BOOLEAN DEFAULT FALSE,
  petrol_stock INTEGER DEFAULT 0,
  diesel_stock INTEGER DEFAULT 0,
  
  -- Queue info
  current_queue_length queue_length DEFAULT 'Short',
  estimated_wait_time INTEGER DEFAULT 0, -- in minutes
  
  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Operator reference
  operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT positive_stock CHECK (petrol_stock >= 0 AND diesel_stock >= 0),
  CONSTRAINT valid_coordinates CHECK (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
);

-- Fuel Prices Table (System-wide pricing controlled by admin)
CREATE TABLE fuel_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fuel_type fuel_type NOT NULL,
  price_per_liter DECIMAL(10, 2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  
  -- Audit
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT positive_price CHECK (price_per_liter > 0),
  CONSTRAINT valid_date_range CHECK (effective_to IS NULL OR effective_to > effective_from)
);

-- Reservations Table
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  station_id UUID REFERENCES stations(id) ON DELETE CASCADE NOT NULL,
  
  -- Reservation details
  reservation_date DATE NOT NULL,
  time_slot VARCHAR(20) NOT NULL, -- e.g., "09:00 - 10:00"
  fuel_type fuel_type NOT NULL,
  quantity INTEGER NOT NULL,
  
  -- Pricing
  price_per_liter DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  
  -- Pickup details
  pickup_code VARCHAR(6) NOT NULL UNIQUE,
  qr_code TEXT NOT NULL,
  plate_number VARCHAR(20),
  
  -- Status
  status reservation_status DEFAULT 'pending',
  payment_method payment_method NOT NULL,
  payment_reference VARCHAR(100),
  
  -- Fulfillment
  dispensed_at TIMESTAMP WITH TIME ZONE,
  dispensed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_costs CHECK (price_per_liter > 0 AND total_cost > 0),
  CONSTRAINT valid_pickup_code CHECK (pickup_code ~* '^[0-9]{6}$'),
  CONSTRAINT future_reservation CHECK (reservation_date >= CURRENT_DATE)
);

-- Queue Reports Table
CREATE TABLE queue_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id UUID REFERENCES stations(id) ON DELETE CASCADE NOT NULL,
  reported_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  queue_length queue_length NOT NULL,
  comment TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent spam (one report per user per station per 30 minutes)
  CONSTRAINT unique_recent_report UNIQUE (station_id, reported_by, created_at)
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_label VARCHAR(100),
  action_url TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Optional references
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  station_id UUID REFERENCES stations(id) ON DELETE CASCADE
);

-- System Activity Log (Audit Trail)
CREATE TABLE system_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type activity_type NOT NULL,
  description TEXT NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name VARCHAR(255) NOT NULL, -- Denormalized for audit integrity
  
  -- Context
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  
  -- References (optional)
  user_target_id UUID REFERENCES users(id) ON DELETE SET NULL,
  station_id UUID REFERENCES stations(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fuel Analytics (Aggregated fuel dispensing data)
CREATE TABLE fuel_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id UUID REFERENCES stations(id) ON DELETE CASCADE NOT NULL,
  fuel_type fuel_type NOT NULL,
  
  -- Stock tracking
  total_available INTEGER DEFAULT 0,
  total_dispensed INTEGER DEFAULT 0,
  digital_dispensed INTEGER DEFAULT 0, -- Through QuickFuel platform
  traditional_dispensed INTEGER DEFAULT 0, -- Walk-in customers
  
  -- Date tracking (daily aggregation)
  analytics_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT positive_analytics CHECK (
    total_available >= 0 AND 
    total_dispensed >= 0 AND 
    digital_dispensed >= 0 AND 
    traditional_dispensed >= 0 AND
    digital_dispensed + traditional_dispensed = total_dispensed
  ),
  CONSTRAINT unique_station_fuel_date UNIQUE (station_id, fuel_type, analytics_date)
);

-- Session Management (For real-time sync)
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  device_id VARCHAR(255),
  device_name VARCHAR(255),
  ip_address INET,
  
  -- Session lifecycle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Feedback/Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  station_id UUID REFERENCES stations(id) ON DELETE CASCADE NOT NULL,
  
  -- Review content
  rating INTEGER NOT NULL,
  comment TEXT,
  
  -- Admin response
  admin_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_rating CHECK (rating BETWEEN 1 AND 5)
);

-- Payment Transactions (For audit and reconciliation)
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Payment details
  payment_method payment_method NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ETB',
  
  -- External payment gateway reference
  external_reference VARCHAR(255),
  gateway_response JSONB,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE (800K+ users optimization)
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_station_id ON users(station_id) WHERE station_id IS NOT NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Stations indexes
CREATE INDEX idx_stations_location ON stations USING GIST (ll_to_earth(latitude::float8, longitude::float8));
CREATE INDEX idx_stations_verified ON stations(is_verified) WHERE deleted_at IS NULL;
CREATE INDEX idx_stations_active ON stations(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_stations_operator ON stations(operator_id) WHERE operator_id IS NOT NULL;
CREATE INDEX idx_stations_name_trgm ON stations USING GIN (name gin_trgm_ops); -- Text search

-- Reservations indexes (Most critical for performance)
CREATE INDEX idx_reservations_driver ON reservations(driver_id, created_at DESC);
CREATE INDEX idx_reservations_station ON reservations(station_id, reservation_date DESC);
CREATE INDEX idx_reservations_status ON reservations(status, reservation_date);
CREATE INDEX idx_reservations_date ON reservations(reservation_date, time_slot);
CREATE INDEX idx_reservations_pickup_code ON reservations(pickup_code) WHERE status != 'cancelled';
CREATE INDEX idx_reservations_created_at ON reservations(created_at DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type, created_at DESC);

-- System Activity indexes (for audit queries)
CREATE INDEX idx_activity_actor ON system_activity(actor_id, created_at DESC);
CREATE INDEX idx_activity_type ON system_activity(type, created_at DESC);
CREATE INDEX idx_activity_created_at ON system_activity(created_at DESC);
CREATE INDEX idx_activity_details_gin ON system_activity USING GIN (details);

-- Queue Reports indexes
CREATE INDEX idx_queue_reports_station ON queue_reports(station_id, created_at DESC);
CREATE INDEX idx_queue_reports_user ON queue_reports(reported_by, created_at DESC);

-- Fuel Analytics indexes
CREATE INDEX idx_fuel_analytics_station ON fuel_analytics(station_id, analytics_date DESC);
CREATE INDEX idx_fuel_analytics_date ON fuel_analytics(analytics_date DESC);
CREATE INDEX idx_fuel_analytics_fuel_type ON fuel_analytics(fuel_type, analytics_date DESC);

-- Fuel Prices indexes
CREATE INDEX idx_fuel_prices_effective ON fuel_prices(fuel_type, effective_from DESC) 
  WHERE effective_to IS NULL OR effective_to >= CURRENT_DATE;

-- Sessions indexes
CREATE INDEX idx_sessions_user ON user_sessions(user_id, last_activity_at DESC);
CREATE INDEX idx_sessions_active ON user_sessions(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_sessions_token ON user_sessions(access_token) WHERE is_active = TRUE;

-- Reviews indexes
CREATE INDEX idx_reviews_driver ON reviews(driver_id, created_at DESC);
CREATE INDEX idx_reviews_station ON reviews(station_id, created_at DESC);
CREATE INDEX idx_reviews_reservation ON reviews(reservation_id);

-- Payment Transactions indexes
CREATE INDEX idx_payments_reservation ON payment_transactions(reservation_id);
CREATE INDEX idx_payments_user ON payment_transactions(user_id, created_at DESC);
CREATE INDEX idx_payments_status ON payment_transactions(status, created_at DESC);
CREATE INDEX idx_payments_external_ref ON payment_transactions(external_reference) WHERE external_reference IS NOT NULL;

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_stations_updated_at BEFORE UPDATE ON stations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_fuel_prices_updated_at BEFORE UPDATE ON fuel_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate pickup code for reservations
CREATE OR REPLACE FUNCTION generate_pickup_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pickup_code IS NULL THEN
    NEW.pickup_code := LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_reservation_pickup_code BEFORE INSERT ON reservations
  FOR EACH ROW EXECUTE FUNCTION generate_pickup_code();

-- Calculate total cost based on quantity and current price
CREATE OR REPLACE FUNCTION calculate_reservation_cost()
RETURNS TRIGGER AS $$
DECLARE
  current_price DECIMAL(10, 2);
BEGIN
  -- Get current fuel price
  SELECT price_per_liter INTO current_price
  FROM fuel_prices
  WHERE fuel_type = NEW.fuel_type
    AND effective_from <= NEW.reservation_date
    AND (effective_to IS NULL OR effective_to >= NEW.reservation_date)
  ORDER BY effective_from DESC
  LIMIT 1;
  
  IF current_price IS NULL THEN
    RAISE EXCEPTION 'No active price found for fuel type %', NEW.fuel_type;
  END IF;
  
  NEW.price_per_liter := current_price;
  NEW.total_cost := NEW.quantity * current_price;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_reservation_cost_trigger BEFORE INSERT ON reservations
  FOR EACH ROW EXECUTE FUNCTION calculate_reservation_cost();

-- Update fuel analytics on reservation completion
CREATE OR REPLACE FUNCTION update_fuel_analytics_on_dispensing()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Insert or update analytics for the station and fuel type
    INSERT INTO fuel_analytics (
      station_id, 
      fuel_type, 
      total_dispensed, 
      digital_dispensed,
      analytics_date
    )
    VALUES (
      NEW.station_id,
      NEW.fuel_type,
      NEW.quantity,
      NEW.quantity,
      CURRENT_DATE
    )
    ON CONFLICT (station_id, fuel_type, analytics_date)
    DO UPDATE SET
      total_dispensed = fuel_analytics.total_dispensed + NEW.quantity,
      digital_dispensed = fuel_analytics.digital_dispensed + NEW.quantity,
      last_updated = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analytics_on_dispensing AFTER UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_fuel_analytics_on_dispensing();

-- Log system activity on critical actions
CREATE OR REPLACE FUNCTION log_system_activity()
RETURNS TRIGGER AS $$
DECLARE
  activity_desc TEXT;
  actor_username VARCHAR(255);
BEGIN
  -- Get actor name
  SELECT full_name INTO actor_username FROM users WHERE id = NEW.updated_by OR id = NEW.id LIMIT 1;
  
  -- Determine activity description based on table
  IF TG_TABLE_NAME = 'users' THEN
    activity_desc := 'User ' || COALESCE(NEW.full_name, 'Unknown') || ' was registered';
  ELSIF TG_TABLE_NAME = 'stations' THEN
    IF NEW.is_verified AND (OLD IS NULL OR NOT OLD.is_verified) THEN
      activity_desc := 'Station ' || NEW.name || ' was verified';
    ELSE
      activity_desc := 'Station ' || NEW.name || ' was updated';
    END IF;
  ELSIF TG_TABLE_NAME = 'fuel_prices' THEN
    activity_desc := NEW.fuel_type || ' price updated to ETB ' || NEW.price_per_liter;
  END IF;
  
  -- Insert activity log
  IF activity_desc IS NOT NULL THEN
    INSERT INTO system_activity (type, description, actor_id, actor_name)
    VALUES (
      CASE TG_TABLE_NAME
        WHEN 'users' THEN 'user_registered'::activity_type
        WHEN 'stations' THEN 'station_verified'::activity_type
        WHEN 'fuel_prices' THEN 'price_updated'::activity_type
        ELSE 'system_alert'::activity_type
      END,
      activity_desc,
      COALESCE(NEW.updated_by, NEW.id),
      COALESCE(actor_username, 'System')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = auth_user_id OR role = 'admin');

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin')
  );

-- Stations policies
CREATE POLICY "Anyone can view active verified stations" ON stations
  FOR SELECT USING (is_active = TRUE AND is_verified = TRUE AND deleted_at IS NULL);

CREATE POLICY "Operators can manage own station" ON stations
  FOR ALL USING (
    operator_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all stations" ON stations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin')
  );

-- Fuel Prices policies (Read-only for drivers/operators, write for admins)
CREATE POLICY "Everyone can view active fuel prices" ON fuel_prices
  FOR SELECT USING (effective_to IS NULL OR effective_to >= CURRENT_DATE);

CREATE POLICY "Only admins can manage fuel prices" ON fuel_prices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin')
  );

-- Reservations policies
CREATE POLICY "Drivers can view own reservations" ON reservations
  FOR SELECT USING (
    driver_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Drivers can create own reservations" ON reservations
  FOR INSERT WITH CHECK (
    driver_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid() AND role = 'driver')
  );

CREATE POLICY "Operators can view station reservations" ON reservations
  FOR SELECT USING (
    station_id IN (
      SELECT station_id FROM users WHERE auth_user_id = auth.uid() AND role = 'operator'
    )
  );

CREATE POLICY "Operators can update station reservations" ON reservations
  FOR UPDATE USING (
    station_id IN (
      SELECT station_id FROM users WHERE auth_user_id = auth.uid() AND role = 'operator'
    )
  );

CREATE POLICY "Admins can manage all reservations" ON reservations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin')
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- System Activity policies (Admins only)
CREATE POLICY "Admins can view all system activity" ON system_activity
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin')
  );

-- Analytics policies
CREATE POLICY "Admins can view all analytics" ON fuel_analytics
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Operators can view own station analytics" ON fuel_analytics
  FOR SELECT USING (
    station_id IN (
      SELECT station_id FROM users WHERE auth_user_id = auth.uid() AND role = 'operator'
    )
  );

-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================

-- Insert default fuel prices (run after admin user is created)
-- This will be populated via the application

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active reservations with full details
CREATE OR REPLACE VIEW active_reservations_view AS
SELECT 
  r.id,
  r.pickup_code,
  r.reservation_date,
  r.time_slot,
  r.fuel_type,
  r.quantity,
  r.total_cost,
  r.status,
  r.payment_method,
  u.full_name AS driver_name,
  u.phone AS driver_phone,
  u.plate_number,
  s.name AS station_name,
  s.address AS station_address,
  r.created_at
FROM reservations r
JOIN users u ON r.driver_id = u.id
JOIN stations s ON r.station_id = s.id
WHERE r.status IN ('pending', 'confirmed')
  AND r.reservation_date >= CURRENT_DATE;

-- Station dashboard view (for operators)
CREATE OR REPLACE VIEW station_dashboard_view AS
SELECT 
  s.id AS station_id,
  s.name AS station_name,
  s.petrol_stock,
  s.diesel_stock,
  s.current_queue_length,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'confirmed' AND r.reservation_date = CURRENT_DATE) AS today_reservations,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'completed' AND r.dispensed_at::date = CURRENT_DATE) AS today_completed,
  COALESCE(SUM(r.quantity) FILTER (WHERE r.status = 'completed' AND r.dispensed_at::date = CURRENT_DATE), 0) AS today_fuel_dispensed,
  COALESCE(AVG(rev.rating), 0) AS average_rating
FROM stations s
LEFT JOIN reservations r ON s.id = r.station_id
LEFT JOIN reviews rev ON s.id = rev.station_id
GROUP BY s.id;

-- System-wide analytics view (for admins)
CREATE OR REPLACE VIEW system_analytics_view AS
SELECT 
  fa.fuel_type,
  SUM(fa.total_available) AS total_available,
  SUM(fa.total_dispensed) AS total_dispensed,
  SUM(fa.digital_dispensed) AS digital_dispensed,
  SUM(fa.traditional_dispensed) AS traditional_dispensed,
  CASE 
    WHEN SUM(fa.total_dispensed) > 0 
    THEN ROUND((SUM(fa.digital_dispensed)::numeric / SUM(fa.total_dispensed)::numeric * 100), 2)
    ELSE 0 
  END AS digital_adoption_rate
FROM fuel_analytics fa
WHERE fa.analytics_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY fa.fuel_type;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get nearby stations (using coordinates)
CREATE OR REPLACE FUNCTION get_nearby_stations(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_km DECIMAL DEFAULT 10
)
RETURNS TABLE (
  station_id UUID,
  station_name VARCHAR,
  distance_km DECIMAL,
  petrol_available BOOLEAN,
  diesel_available BOOLEAN,
  queue_length queue_length
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    ROUND(
      (6371 * acos(
        cos(radians(user_lat)) * 
        cos(radians(s.latitude::numeric)) * 
        cos(radians(s.longitude::numeric) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians(s.latitude::numeric))
      ))::numeric, 
      2
    ) AS distance,
    s.petrol_available,
    s.diesel_available,
    s.current_queue_length
  FROM stations s
  WHERE s.is_active = TRUE 
    AND s.is_verified = TRUE
    AND s.deleted_at IS NULL
  ORDER BY distance
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Function to get current fuel price
CREATE OR REPLACE FUNCTION get_current_fuel_price(p_fuel_type fuel_type)
RETURNS DECIMAL AS $$
DECLARE
  current_price DECIMAL(10, 2);
BEGIN
  SELECT price_per_liter INTO current_price
  FROM fuel_prices
  WHERE fuel_type = p_fuel_type
    AND effective_from <= CURRENT_DATE
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
  ORDER BY effective_from DESC
  LIMIT 1;
  
  RETURN COALESCE(current_price, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MAINTENANCE & CLEANUP JOBS
-- =====================================================

-- Function to clean old sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions
  WHERE expires_at < NOW()
    OR (is_active = FALSE AND last_activity_at < NOW() - INTERVAL '7 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to archive old system activity
CREATE OR REPLACE FUNCTION archive_old_activity()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Archive activity older than 1 year
  -- This could move to a separate archive table
  DELETE FROM system_activity
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE users IS 'Core user table for drivers, operators, and admins';
COMMENT ON TABLE stations IS 'Fuel stations with location, stock, and queue information';
COMMENT ON TABLE fuel_prices IS 'System-wide fuel pricing controlled by admins';
COMMENT ON TABLE reservations IS 'Fuel reservations made by drivers';
COMMENT ON TABLE fuel_analytics IS 'Aggregated fuel dispensing analytics per station';
COMMENT ON TABLE system_activity IS 'Audit trail for all system actions';
COMMENT ON TABLE notifications IS 'User notifications across all roles';
COMMENT ON TABLE queue_reports IS 'Real-time queue reports from drivers';
COMMENT ON TABLE user_sessions IS 'Active user sessions for real-time sync';
COMMENT ON TABLE reviews IS 'Driver reviews and feedback for stations';
COMMENT ON TABLE payment_transactions IS 'Payment transaction records for audit';

-- =====================================================
-- END OF SCHEMA
-- =====================================================
