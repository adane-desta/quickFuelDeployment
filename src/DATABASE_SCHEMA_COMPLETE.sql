-- =====================================================
-- QUICKFUEL PRODUCTION DATABASE SCHEMA
-- =====================================================
-- Complete, production-ready database design for QuickFuel
-- Designed to handle high traffic, real-time updates, and complex queries
-- 
-- FEATURES:
-- ✅ 10 interconnected tables with referential integrity
-- ✅ Advanced Row Level Security (RLS) policies
-- ✅ Optimized indexes for fast queries
-- ✅ Automated triggers for data consistency
-- ✅ Real-time subscriptions enabled
-- ✅ Comprehensive audit logging
-- ✅ Ethiopian-specific validations
-- ✅ Payment gateway integration support
-- =====================================================

-- =====================================================
-- STEP 1: CLEAN SLATE - Drop All Existing Objects
-- =====================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
DROP TRIGGER IF EXISTS update_stations_updated_at ON stations;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_fuel_prices_updated_at ON fuel_prices;
DROP TRIGGER IF EXISTS on_reservation_completed ON reservations;
DROP TRIGGER IF EXISTS on_stock_change ON stations;

-- Drop functions
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS update_station_stock_on_reservation CASCADE;
DROP FUNCTION IF EXISTS create_reservation_notification CASCADE;
DROP FUNCTION IF EXISTS calculate_average_wait_time CASCADE;

-- Drop tables in reverse dependency order
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

-- =====================================================
-- STEP 2: CREATE CORE TABLES
-- =====================================================

-- -----------------------------------------------------
-- TABLE: users
-- Purpose: Extends auth.users with role-based profiles
-- Roles: admin, operator, driver
-- -----------------------------------------------------
CREATE TABLE users (
  -- Primary Key (references Supabase auth.users)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core user information
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL CHECK (length(full_name) >= 2),
  phone TEXT NOT NULL CHECK (phone ~ '^\+251[97]\d{8}$'), -- Ethiopian phone format
  role TEXT NOT NULL CHECK (role IN ('admin', 'driver', 'operator')),
  is_active BOOLEAN DEFAULT true NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login_at TIMESTAMPTZ,
  
  -- Driver-specific fields (NULL for admin/operator)
  address TEXT,
  vehicle_model TEXT,
  plate_number TEXT UNIQUE CHECK (plate_number ~ '^[A-Z]{1,3}-\d{1}-\d{5}$' OR plate_number IS NULL), -- Ethiopian plate format
  preferred_fuel_type TEXT CHECK (preferred_fuel_type IN ('Petrol', 'Diesel') OR preferred_fuel_type IS NULL),
  license_number TEXT,
  
  -- Operator-specific fields (NULL for admin/driver)
  station_id UUID, -- Foreign key added later
  
  -- Admin-specific fields (NULL for driver/operator)
  employee_id TEXT UNIQUE,
  department TEXT,
  
  -- Metadata
  profile_picture_url TEXT,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
  
  -- Constraints
  CONSTRAINT valid_driver_fields CHECK (
    role != 'driver' OR (address IS NOT NULL AND vehicle_model IS NOT NULL AND plate_number IS NOT NULL)
  ),
  CONSTRAINT valid_operator_fields CHECK (
    role != 'operator' OR station_id IS NOT NULL
  ),
  CONSTRAINT valid_admin_fields CHECK (
    role != 'admin' OR (employee_id IS NOT NULL AND department IS NOT NULL)
  )
);

COMMENT ON TABLE users IS 'User profiles extending auth.users with role-based information';
COMMENT ON COLUMN users.phone IS 'Ethiopian phone number format: +251XXXXXXXXX';
COMMENT ON COLUMN users.plate_number IS 'Ethiopian vehicle plate format: AA-1-12345';

-- -----------------------------------------------------
-- TABLE: stations
-- Purpose: Fuel station information and inventory
-- -----------------------------------------------------
CREATE TABLE stations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Station information
  name TEXT NOT NULL CHECK (length(name) >= 3),
  address TEXT NOT NULL,
  phone TEXT NOT NULL CHECK (phone ~ '^\+251[97]\d{8}$'),
  operating_hours TEXT DEFAULT '24/7' NOT NULL,
  
  -- Geolocation (Addis Ababa coordinates: ~9°N, 38.7°E)
  latitude DECIMAL(10, 8) NOT NULL CHECK (latitude BETWEEN 8.0 AND 10.0),
  longitude DECIMAL(11, 8) NOT NULL CHECK (longitude BETWEEN 37.0 AND 40.0),
  
  -- Relationships
  operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Fuel inventory (in liters)
  petrol_stock DECIMAL(10, 2) DEFAULT 0 NOT NULL CHECK (petrol_stock >= 0),
  diesel_stock DECIMAL(10, 2) DEFAULT 0 NOT NULL CHECK (diesel_stock >= 0),
  
  -- Availability flags
  petrol_available BOOLEAN DEFAULT false NOT NULL,
  diesel_available BOOLEAN DEFAULT false NOT NULL,
  
  -- Administrative
  is_verified BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Metadata
  station_image_url TEXT,
  amenities JSONB DEFAULT '[]'::jsonb, -- ["restroom", "car_wash", "shop"]
  average_rating DECIMAL(3, 2) DEFAULT 0.0 CHECK (average_rating BETWEEN 0 AND 5),
  total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
  
  -- Queue information (cached from queue_reports)
  current_queue_length INTEGER DEFAULT 0 CHECK (current_queue_length >= 0),
  average_wait_time INTEGER DEFAULT 0 CHECK (average_wait_time >= 0) -- minutes
);

COMMENT ON TABLE stations IS 'Fuel station locations, inventory, and operational details';
COMMENT ON COLUMN stations.latitude IS 'Latitude coordinate (Addis Ababa area: 8-10°N)';
COMMENT ON COLUMN stations.longitude IS 'Longitude coordinate (Addis Ababa area: 37-40°E)';

-- -----------------------------------------------------
-- TABLE: fuel_prices
-- Purpose: System-wide fuel pricing (government-regulated)
-- -----------------------------------------------------
CREATE TABLE fuel_prices (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Fuel type (unique constraint ensures one price per type)
  fuel_type TEXT NOT NULL UNIQUE CHECK (fuel_type IN ('Petrol', 'Diesel')),
  
  -- Pricing
  price_per_liter DECIMAL(10, 2) NOT NULL CHECK (price_per_liter > 0),
  
  -- Effective period
  effective_from DATE NOT NULL,
  effective_until DATE,
  
  -- Administrative
  updated_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Price history metadata
  previous_price DECIMAL(10, 2),
  change_reason TEXT,
  
  CONSTRAINT valid_effective_period CHECK (effective_until IS NULL OR effective_until >= effective_from)
);

COMMENT ON TABLE fuel_prices IS 'Government-regulated fuel prices (system-wide)';
COMMENT ON COLUMN fuel_prices.effective_from IS 'Date when this price becomes active';

-- -----------------------------------------------------
-- TABLE: reservations
-- Purpose: Fuel reservation and purchase tracking
-- Status Flow: pending → confirmed → completed (or cancelled)
-- Payment Flow: pending → paid (or failed/refunded)
-- -----------------------------------------------------
CREATE TABLE reservations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  
  -- Fuel details
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('Petrol', 'Diesel')),
  quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0 AND quantity <= 200), -- Max 200L per reservation
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price > 0),
  
  -- Reservation status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  
  -- Payment details
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('Telebirr', 'Chapa') OR payment_method IS NULL),
  transaction_id TEXT UNIQUE,
  
  -- Pickup verification
  pickup_code TEXT UNIQUE CHECK (length(pickup_code) = 6), -- 6-digit code
  qr_code TEXT, -- Base64 encoded QR code
  
  -- Scheduling
  scheduled_time TIMESTAMPTZ,
  
  -- Lifecycle timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Cancellation
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metadata
  notes TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5 OR rating IS NULL),
  
  -- Business rules
  CONSTRAINT valid_completion CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR 
    (status != 'completed' AND completed_at IS NULL)
  ),
  CONSTRAINT valid_cancellation CHECK (
    (status = 'cancelled' AND cancelled_at IS NOT NULL) OR 
    (status != 'cancelled' AND cancelled_at IS NULL)
  ),
  CONSTRAINT valid_payment_completion CHECK (
    (status = 'completed' AND payment_status = 'paid') OR 
    (status != 'completed')
  )
);

COMMENT ON TABLE reservations IS 'Fuel reservations with complete lifecycle tracking';
COMMENT ON COLUMN reservations.pickup_code IS '6-digit verification code for fuel pickup';
COMMENT ON COLUMN reservations.quantity IS 'Fuel quantity in liters (max 200L)';

-- -----------------------------------------------------
-- TABLE: notifications
-- Purpose: User notifications and alerts
-- -----------------------------------------------------
CREATE TABLE notifications (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification details
  type TEXT NOT NULL CHECK (type IN ('reservation', 'price_change', 'station_update', 'system', 'promotion', 'alert')),
  title TEXT NOT NULL CHECK (length(title) >= 1),
  message TEXT NOT NULL CHECK (length(message) >= 1),
  
  -- Status
  is_read BOOLEAN DEFAULT false NOT NULL,
  read_at TIMESTAMPTZ,
  
  -- Relationships
  related_id UUID, -- ID of related entity (reservation, station, etc.)
  related_type TEXT CHECK (related_type IN ('reservation', 'station', 'user', 'price') OR related_type IS NULL),
  
  -- Priority
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Delivery
  delivery_method JSONB DEFAULT '["app"]'::jsonb, -- ["app", "email", "sms"]
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  action_url TEXT,
  metadata JSONB
);

COMMENT ON TABLE notifications IS 'User notifications and system alerts';
COMMENT ON COLUMN notifications.priority IS 'Notification urgency level';

-- -----------------------------------------------------
-- TABLE: queue_reports
-- Purpose: Real-time queue status reporting from drivers
-- -----------------------------------------------------
CREATE TABLE queue_reports (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Queue data
  queue_length INTEGER NOT NULL CHECK (queue_length >= 0 AND queue_length <= 100),
  wait_time_minutes INTEGER NOT NULL CHECK (wait_time_minutes >= 0 AND wait_time_minutes <= 480), -- Max 8 hours
  
  -- Fuel type context
  fuel_type TEXT CHECK (fuel_type IN ('Petrol', 'Diesel', 'Both') OR fuel_type IS NULL),
  
  -- Validation
  is_verified BOOLEAN DEFAULT false,
  verification_count INTEGER DEFAULT 1 CHECK (verification_count > 0),
  
  -- Timestamps
  reported_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Metadata
  notes TEXT,
  location_accuracy DECIMAL(5, 2) -- meters
);

COMMENT ON TABLE queue_reports IS 'Crowd-sourced real-time queue status from drivers';
COMMENT ON COLUMN queue_reports.verification_count IS 'Number of drivers reporting similar data';

-- -----------------------------------------------------
-- TABLE: fuel_analytics
-- Purpose: Fuel dispensing and revenue tracking
-- -----------------------------------------------------
CREATE TABLE fuel_analytics (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  
  -- Fuel transaction
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('Petrol', 'Diesel')),
  quantity_dispensed DECIMAL(10, 2) NOT NULL CHECK (quantity_dispensed >= 0),
  price_per_liter DECIMAL(10, 2) NOT NULL CHECK (price_per_liter > 0),
  revenue DECIMAL(10, 2) NOT NULL CHECK (revenue >= 0),
  
  -- Cost tracking
  cost_per_liter DECIMAL(10, 2) CHECK (cost_per_liter > 0),
  profit DECIMAL(10, 2),
  
  -- Administrative
  recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metadata
  shift TEXT, -- "morning", "afternoon", "night"
  transaction_type TEXT DEFAULT 'reservation' CHECK (transaction_type IN ('reservation', 'walk_in', 'emergency')),
  notes TEXT
);

COMMENT ON TABLE fuel_analytics IS 'Detailed fuel dispensing records for analytics and reporting';
COMMENT ON COLUMN fuel_analytics.profit IS 'Revenue minus cost (gross profit)';

-- -----------------------------------------------------
-- TABLE: system_activity
-- Purpose: Comprehensive audit log for all system actions
-- -----------------------------------------------------
CREATE TABLE system_activity (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_role TEXT,
  user_email TEXT,
  
  -- Action details
  action TEXT NOT NULL CHECK (length(action) >= 3),
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('auth', 'reservation', 'payment', 'station', 'user', 'system', 'general')),
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  
  -- Metadata
  metadata JSONB,
  
  -- Affected resources
  affected_resource_type TEXT,
  affected_resource_id UUID,
  
  -- Result
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE system_activity IS 'Complete audit trail for security and compliance';
COMMENT ON COLUMN system_activity.category IS 'Action category for filtering and reporting';

-- -----------------------------------------------------
-- TABLE: reviews
-- Purpose: Station ratings and feedback from drivers
-- -----------------------------------------------------
CREATE TABLE reviews (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  
  -- Review aspects (optional detailed ratings)
  service_rating INTEGER CHECK (service_rating BETWEEN 1 AND 5 OR service_rating IS NULL),
  cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5 OR cleanliness_rating IS NULL),
  wait_time_rating INTEGER CHECK (wait_time_rating BETWEEN 1 AND 5 OR wait_time_rating IS NULL),
  
  -- Moderation
  is_flagged BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  flagged_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Unique constraint: one review per reservation
  CONSTRAINT unique_review_per_reservation UNIQUE (reservation_id)
);

COMMENT ON TABLE reviews IS 'Driver reviews and ratings for fuel stations';
COMMENT ON COLUMN reviews.rating IS 'Overall rating (1-5 stars)';

-- -----------------------------------------------------
-- TABLE: payment_transactions
-- Purpose: Payment gateway transaction tracking
-- -----------------------------------------------------
CREATE TABLE payment_transactions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Telebirr', 'Chapa')),
  transaction_reference TEXT UNIQUE NOT NULL,
  
  -- Gateway response
  gateway_transaction_id TEXT,
  gateway_response JSONB,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'refunded', 'disputed')),
  
  -- Timestamps
  initiated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  -- Error handling
  error_message TEXT,
  error_code TEXT,
  retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0),
  
  -- Refund tracking
  refund_amount DECIMAL(10, 2) CHECK (refund_amount >= 0 AND refund_amount <= amount),
  refund_reason TEXT,
  refunded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metadata
  ip_address TEXT,
  device_info JSONB
);

COMMENT ON TABLE payment_transactions IS 'Payment gateway transaction records with full lifecycle tracking';
COMMENT ON COLUMN payment_transactions.transaction_reference IS 'Unique reference for idempotency';

-- =====================================================
-- STEP 3: ADD FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add station_id foreign key to users table
ALTER TABLE users
  ADD CONSTRAINT fk_users_station
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL;

-- =====================================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_role ON users(role) WHERE is_active = true;
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_plate_number ON users(plate_number) WHERE plate_number IS NOT NULL;
CREATE INDEX idx_users_station ON users(station_id) WHERE station_id IS NOT NULL;
CREATE INDEX idx_users_active ON users(is_active);

-- Stations table indexes
CREATE INDEX idx_stations_operator ON stations(operator_id);
CREATE INDEX idx_stations_location ON stations USING GIST(ll_to_earth(latitude::double precision, longitude::double precision));
CREATE INDEX idx_stations_verified_active ON stations(is_verified, is_active) WHERE is_active = true;
CREATE INDEX idx_stations_petrol_available ON stations(petrol_available) WHERE petrol_available = true;
CREATE INDEX idx_stations_diesel_available ON stations(diesel_available) WHERE diesel_available = true;
CREATE INDEX idx_stations_rating ON stations(average_rating DESC);

-- Reservations table indexes
CREATE INDEX idx_reservations_driver ON reservations(driver_id);
CREATE INDEX idx_reservations_station ON reservations(station_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_payment_status ON reservations(payment_status);
CREATE INDEX idx_reservations_pickup_code ON reservations(pickup_code) WHERE pickup_code IS NOT NULL;
CREATE INDEX idx_reservations_created_at ON reservations(created_at DESC);
CREATE INDEX idx_reservations_scheduled_time ON reservations(scheduled_time) WHERE scheduled_time IS NOT NULL;
CREATE INDEX idx_reservations_active ON reservations(status) WHERE status IN ('pending', 'confirmed');

-- Notifications table indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority, created_at DESC) WHERE priority IN ('high', 'urgent');

-- Queue reports table indexes
CREATE INDEX idx_queue_reports_station ON queue_reports(station_id, reported_at DESC);
CREATE INDEX idx_queue_reports_recent ON queue_reports(reported_at DESC) WHERE reported_at > NOW() - INTERVAL '2 hours';

-- Fuel analytics table indexes
CREATE INDEX idx_fuel_analytics_station ON fuel_analytics(station_id, recorded_at DESC);
CREATE INDEX idx_fuel_analytics_date ON fuel_analytics(recorded_at DESC);
CREATE INDEX idx_fuel_analytics_reservation ON fuel_analytics(reservation_id) WHERE reservation_id IS NOT NULL;

-- System activity table indexes
CREATE INDEX idx_system_activity_user ON system_activity(user_id, created_at DESC);
CREATE INDEX idx_system_activity_date ON system_activity(created_at DESC);
CREATE INDEX idx_system_activity_category ON system_activity(category, created_at DESC);
CREATE INDEX idx_system_activity_resource ON system_activity(affected_resource_type, affected_resource_id);

-- Reviews table indexes
CREATE INDEX idx_reviews_station ON reviews(station_id, created_at DESC) WHERE is_visible = true;
CREATE INDEX idx_reviews_driver ON reviews(driver_id);
CREATE INDEX idx_reviews_rating ON reviews(rating DESC);

-- Payment transactions table indexes
CREATE INDEX idx_payment_transactions_reservation ON payment_transactions(reservation_id);
CREATE INDEX idx_payment_transactions_reference ON payment_transactions(transaction_reference);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_date ON payment_transactions(initiated_at DESC);

-- =====================================================
-- STEP 5: CREATE FUNCTIONS
-- =====================================================

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Handle new user creation from auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if it doesn't exist
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

-- Function: Calculate average wait time for a station
CREATE OR REPLACE FUNCTION calculate_average_wait_time(p_station_id UUID)
RETURNS INTEGER AS $$
DECLARE
  avg_wait INTEGER;
BEGIN
  SELECT COALESCE(AVG(wait_time_minutes)::INTEGER, 0)
  INTO avg_wait
  FROM queue_reports
  WHERE station_id = p_station_id
    AND reported_at > NOW() - INTERVAL '2 hours';
  
  RETURN avg_wait;
END;
$$ LANGUAGE plpgsql;

-- Function: Update station stock when reservation is completed
CREATE OR REPLACE FUNCTION update_station_stock_on_reservation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Reduce fuel stock
    UPDATE stations
    SET 
      petrol_stock = CASE 
        WHEN NEW.fuel_type = 'Petrol' THEN petrol_stock - NEW.quantity
        ELSE petrol_stock
      END,
      diesel_stock = CASE 
        WHEN NEW.fuel_type = 'Diesel' THEN diesel_stock - NEW.quantity
        ELSE diesel_stock
      END
    WHERE id = NEW.station_id;
    
    -- Create analytics record
    INSERT INTO fuel_analytics (
      station_id,
      reservation_id,
      fuel_type,
      quantity_dispensed,
      price_per_liter,
      revenue,
      recorded_by
    )
    SELECT
      NEW.station_id,
      NEW.id,
      NEW.fuel_type,
      NEW.quantity,
      NEW.total_price / NEW.quantity,
      NEW.total_price,
      NEW.driver_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update station availability based on stock
CREATE OR REPLACE FUNCTION update_station_availability()
RETURNS TRIGGER AS $$
BEGIN
  NEW.petrol_available = (NEW.petrol_stock > 100); -- Min 100L to be available
  NEW.diesel_available = (NEW.diesel_stock > 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Create notification when reservation status changes
CREATE OR REPLACE FUNCTION create_reservation_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  IF NEW.status != OLD.status THEN
    CASE NEW.status
      WHEN 'confirmed' THEN
        notification_title := 'Reservation Confirmed';
        notification_message := 'Your fuel reservation has been confirmed. Pickup code: ' || NEW.pickup_code;
      WHEN 'completed' THEN
        notification_title := 'Reservation Completed';
        notification_message := 'Your fuel has been dispensed successfully. Thank you!';
      WHEN 'cancelled' THEN
        notification_title := 'Reservation Cancelled';
        notification_message := 'Your reservation has been cancelled. ' || COALESCE(NEW.cancellation_reason, 'No reason provided.');
      ELSE
        RETURN NEW;
    END CASE;
    
    INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
    VALUES (NEW.driver_id, 'reservation', notification_title, notification_message, NEW.id, 'reservation');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 6: CREATE TRIGGERS
-- =====================================================

-- Trigger: Update updated_at for users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at for stations
CREATE TRIGGER update_stations_updated_at
  BEFORE UPDATE ON stations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at for reservations
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at for fuel_prices
CREATE TRIGGER update_fuel_prices_updated_at
  BEFORE UPDATE ON fuel_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at for reviews
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Handle new auth user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Trigger: Update station stock on reservation completion
CREATE TRIGGER on_reservation_completed
  AFTER UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_station_stock_on_reservation();

-- Trigger: Update station availability on stock change
CREATE TRIGGER on_stock_change
  BEFORE UPDATE ON stations
  FOR EACH ROW
  WHEN (OLD.petrol_stock != NEW.petrol_stock OR OLD.diesel_stock != NEW.diesel_stock)
  EXECUTE FUNCTION update_station_availability();

-- Trigger: Create notification on reservation status change
CREATE TRIGGER on_reservation_status_change
  AFTER UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION create_reservation_notification();

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Next: Run the RLS policies and initial data scripts
-- =====================================================
