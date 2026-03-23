-- =====================================================
-- QUICKFUEL ADVANCED DIGITAL SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Version 2.0 - Complete Digital Transformation
-- Features:
-- ✅ Time-slot based reservations (no physical queue)
-- ✅ Station Owner + Operator roles
-- ✅ Automatic fuel inventory tracking
-- ✅ Multi-fuel type support (Petrol, Diesel, Benzene, Gasoline)
-- ✅ Fuel delivery approval workflow
-- ✅ Dynamic capacity calculation
-- ✅ Reservation expiration logic
-- ✅ Advanced analytics & reporting
-- =====================================================

-- =====================================================
-- STEP 1: CLEAN SLATE
-- =====================================================

-- Drop all triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS update_users_updated_at ON users CASCADE;
DROP TRIGGER IF EXISTS update_stations_updated_at ON stations CASCADE;
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations CASCADE;
DROP TRIGGER IF EXISTS on_reservation_completed ON reservations CASCADE;
DROP TRIGGER IF EXISTS on_fuel_delivery_approved ON fuel_deliveries CASCADE;
DROP TRIGGER IF EXISTS generate_time_slots_on_station_update ON stations CASCADE;
DROP TRIGGER IF EXISTS update_slot_capacity_on_reservation ON reservations CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS generate_time_slots_for_station CASCADE;
DROP FUNCTION IF EXISTS calculate_slot_capacity CASCADE;
DROP FUNCTION IF EXISTS update_fuel_inventory_on_delivery CASCADE;
DROP FUNCTION IF EXISTS update_fuel_inventory_on_dispensing CASCADE;
DROP FUNCTION IF EXISTS check_reservation_expiration CASCADE;
DROP FUNCTION IF EXISTS get_available_time_slots CASCADE;

-- Drop all tables
DROP TABLE IF EXISTS analytics_dashboard CASCADE;
DROP TABLE IF EXISTS reservation_history CASCADE;
DROP TABLE IF EXISTS fuel_dispensing_logs CASCADE;
DROP TABLE IF EXISTS fuel_deliveries CASCADE;
DROP TABLE IF EXISTS station_fuel_inventory CASCADE;
DROP TABLE IF EXISTS fuel_types CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS system_activity CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS stations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- STEP 2: CREATE CORE TABLES
-- =====================================================

-- -----------------------------------------------------
-- TABLE: users (Enhanced with Station Owner role)
-- -----------------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core Information
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL CHECK (length(full_name) >= 2),
  phone TEXT NOT NULL CHECK (phone ~ '^\+251[97]\d{8}$'),
  role TEXT NOT NULL CHECK (role IN ('admin', 'station_owner', 'operator', 'driver')),
  is_active BOOLEAN DEFAULT true NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login_at TIMESTAMPTZ,
  
  -- Driver-specific fields
  address TEXT,
  vehicle_model TEXT,
  plate_number TEXT UNIQUE CHECK (plate_number ~ '^[A-Z]{1,3}-\d{1}-\d{5}$' OR plate_number IS NULL),
  preferred_fuel_type TEXT,
  license_number TEXT,
  
  -- Operator-specific fields
  station_id UUID,
  operator_status TEXT CHECK (operator_status IN ('active', 'blocked', 'pending') OR operator_status IS NULL),
  hired_date DATE,
  
  -- Station Owner-specific fields
  business_license_number TEXT,
  tax_identification_number TEXT,
  business_address TEXT,
  
  -- Admin-specific fields
  employee_id TEXT UNIQUE,
  department TEXT,
  
  -- Profile & Settings
  profile_picture_url TEXT,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
  
  -- Constraints
  CONSTRAINT valid_driver_fields CHECK (
    role != 'driver' OR (address IS NOT NULL AND vehicle_model IS NOT NULL AND plate_number IS NOT NULL)
  ),
  CONSTRAINT valid_operator_fields CHECK (
    role != 'operator' OR station_id IS NOT NULL
  ),
  CONSTRAINT valid_station_owner_fields CHECK (
    role != 'station_owner' OR business_license_number IS NOT NULL
  ),
  CONSTRAINT valid_admin_fields CHECK (
    role != 'admin' OR (employee_id IS NOT NULL AND department IS NOT NULL)
  )
);

COMMENT ON TABLE users IS 'User profiles with enhanced roles: admin, station_owner, operator, driver';
COMMENT ON COLUMN users.role IS 'User role: admin | station_owner | operator | driver';

-- -----------------------------------------------------
-- TABLE: fuel_types (System-wide fuel types)
-- -----------------------------------------------------
CREATE TABLE fuel_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Fuel Type Information
  name TEXT NOT NULL UNIQUE CHECK (length(name) >= 2), -- Petrol, Diesel, Benzene, Gasoline, Premium, etc.
  code TEXT NOT NULL UNIQUE CHECK (length(code) = 3), -- PET, DIS, BEN, GAS, PRM
  description TEXT,
  
  -- Pricing
  base_price_per_liter DECIMAL(10, 2) NOT NULL CHECK (base_price_per_liter > 0),
  
  -- Status
  is_active BOOLEAN DEFAULT true NOT NULL,
  
  -- Administrative
  effective_from DATE DEFAULT CURRENT_DATE NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Metadata
  color_code TEXT, -- For UI display (hex color)
  density DECIMAL(6, 4), -- g/cm³
  octane_rating INTEGER CHECK (octane_rating > 0 OR octane_rating IS NULL)
);

COMMENT ON TABLE fuel_types IS 'System-wide fuel type definitions and pricing';

-- -----------------------------------------------------
-- TABLE: stations (Enhanced with scheduling & capacity)
-- -----------------------------------------------------
CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  name TEXT NOT NULL CHECK (length(name) >= 3),
  address TEXT NOT NULL,
  phone TEXT NOT NULL CHECK (phone ~ '^\+251[97]\d{8}$'),
  
  -- Geolocation
  latitude DECIMAL(10, 8) NOT NULL CHECK (latitude BETWEEN 8.0 AND 10.0),
  longitude DECIMAL(11, 8) NOT NULL CHECK (longitude BETWEEN 37.0 AND 40.0),
  
  -- Ownership & Management
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Operating Schedule
  operating_days JSONB DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]'::jsonb,
  opening_time TIME NOT NULL DEFAULT '06:00',
  closing_time TIME NOT NULL DEFAULT '22:00',
  is_24_hours BOOLEAN DEFAULT false,
  
  -- Capacity Configuration
  number_of_pumps INTEGER NOT NULL DEFAULT 2 CHECK (number_of_pumps > 0),
  vehicles_per_pump_per_slot INTEGER DEFAULT 2 CHECK (vehicles_per_pump_per_slot > 0),
  
  -- License & Documentation
  business_license_number TEXT NOT NULL,
  operating_license_number TEXT,
  environmental_clearance_number TEXT,
  fire_safety_certificate_number TEXT,
  license_expiry_date DATE,
  
  -- Status
  is_verified BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  verification_date TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Metadata
  station_image_url TEXT,
  amenities JSONB DEFAULT '[]'::jsonb,
  average_rating DECIMAL(3, 2) DEFAULT 0.0 CHECK (average_rating BETWEEN 0 AND 5),
  total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
  
  -- Constraints
  CONSTRAINT valid_operating_hours CHECK (
    is_24_hours = true OR (opening_time < closing_time)
  )
);

COMMENT ON TABLE stations IS 'Fuel stations with scheduling, capacity, and license information';
COMMENT ON COLUMN stations.number_of_pumps IS 'Total fueling pumps for capacity calculation';
COMMENT ON COLUMN stations.vehicles_per_pump_per_slot IS 'Average vehicles each pump can serve per hour slot';

-- -----------------------------------------------------
-- TABLE: station_fuel_inventory (Per-station fuel tracking)
-- -----------------------------------------------------
CREATE TABLE station_fuel_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  fuel_type_id UUID NOT NULL REFERENCES fuel_types(id) ON DELETE CASCADE,
  
  -- Inventory
  current_stock DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (current_stock >= 0), -- in liters
  minimum_stock_threshold DECIMAL(12, 2) DEFAULT 500 CHECK (minimum_stock_threshold >= 0),
  maximum_capacity DECIMAL(12, 2) NOT NULL CHECK (maximum_capacity > 0),
  
  -- Availability
  is_available BOOLEAN DEFAULT false NOT NULL,
  
  -- Price Override (optional, uses fuel_types.base_price if NULL)
  custom_price_per_liter DECIMAL(10, 2) CHECK (custom_price_per_liter > 0 OR custom_price_per_liter IS NULL),
  
  -- Timestamps
  last_refilled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Unique: One inventory record per station per fuel type
  CONSTRAINT unique_station_fuel UNIQUE (station_id, fuel_type_id)
);

COMMENT ON TABLE station_fuel_inventory IS 'Per-station fuel inventory tracking with auto-calculation';
COMMENT ON COLUMN station_fuel_inventory.current_stock IS 'Current fuel stock in liters (auto-updated)';

-- -----------------------------------------------------
-- TABLE: fuel_deliveries (Fuel delivery tracking)
-- -----------------------------------------------------
CREATE TABLE fuel_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  fuel_type_id UUID NOT NULL REFERENCES fuel_types(id) ON DELETE CASCADE,
  
  -- Delivery Information
  delivery_reference TEXT UNIQUE NOT NULL,
  quantity DECIMAL(12, 2) NOT NULL CHECK (quantity > 0), -- in liters
  supplier_name TEXT NOT NULL,
  supplier_contact TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'delivered')),
  
  -- Approval Workflow
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Delivery Details
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  delivery_note TEXT,
  
  -- Financial
  cost_per_liter DECIMAL(10, 2) CHECK (cost_per_liter > 0),
  total_cost DECIMAL(12, 2) CHECK (total_cost > 0),
  invoice_number TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Documents
  delivery_receipt_url TEXT,
  invoice_url TEXT
);

COMMENT ON TABLE fuel_deliveries IS 'Fuel delivery tracking with admin approval workflow';
COMMENT ON COLUMN fuel_deliveries.status IS 'pending (owner request) → approved (admin) → delivered (owner confirms)';

-- -----------------------------------------------------
-- TABLE: time_slots (Auto-generated time slots)
-- -----------------------------------------------------
CREATE TABLE time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  
  -- Slot Information
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Capacity
  max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
  current_reservations INTEGER DEFAULT 0 CHECK (current_reservations >= 0),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'limited', 'full', 'closed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Unique: One slot per station per date per time
  CONSTRAINT unique_station_slot UNIQUE (station_id, slot_date, start_time),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  CONSTRAINT valid_reservations CHECK (current_reservations <= max_capacity)
);

COMMENT ON TABLE time_slots IS 'Auto-generated hourly time slots for reservations';
COMMENT ON COLUMN time_slots.max_capacity IS 'Calculated as: number_of_pumps × vehicles_per_pump_per_slot';
COMMENT ON COLUMN time_slots.status IS 'available | limited (>75% full) | full (100%) | closed';

-- Create index for fast slot queries
CREATE INDEX idx_time_slots_station_date ON time_slots(station_id, slot_date, start_time);
CREATE INDEX idx_time_slots_available ON time_slots(station_id, slot_date, status) WHERE status IN ('available', 'limited');

-- -----------------------------------------------------
-- TABLE: reservations (Enhanced with time slots)
-- -----------------------------------------------------
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  time_slot_id UUID NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  fuel_type_id UUID NOT NULL REFERENCES fuel_types(id) ON DELETE CASCADE,
  
  -- Fuel Details
  quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0 AND quantity <= 200),
  price_per_liter DECIMAL(10, 2) NOT NULL CHECK (price_per_liter > 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price > 0),
  
  -- Reservation Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'arrived', 'dispensing', 'completed', 'cancelled', 'expired')),
  
  -- Payment
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('Telebirr', 'Chapa', 'Cash') OR payment_method IS NULL),
  
  -- Pickup Verification
  pickup_code TEXT UNIQUE NOT NULL CHECK (length(pickup_code) = 6),
  qr_code TEXT,
  
  -- Expiration Logic
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Lifecycle Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  confirmed_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  dispensing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  
  -- Cancellation
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Operator Actions
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  dispensed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metadata
  notes TEXT,
  driver_rating INTEGER CHECK (driver_rating BETWEEN 1 AND 5 OR driver_rating IS NULL),
  
  -- Business Rules
  CONSTRAINT valid_completion CHECK (
    (status = 'completed' AND completed_at IS NOT NULL AND dispensed_by IS NOT NULL) OR 
    (status != 'completed')
  ),
  CONSTRAINT valid_expiration CHECK (
    (status = 'expired' AND expired_at IS NOT NULL) OR 
    (status != 'expired')
  )
);

COMMENT ON TABLE reservations IS 'Time-slot based fuel reservations with expiration logic';
COMMENT ON COLUMN reservations.pickup_code IS '6-digit unique code for station verification';
COMMENT ON COLUMN reservations.expires_at IS 'Slot end time + 15 minutes grace period';

-- Create indexes
CREATE INDEX idx_reservations_driver ON reservations(driver_id, created_at DESC);
CREATE INDEX idx_reservations_station ON reservations(station_id, status);
CREATE INDEX idx_reservations_time_slot ON reservations(time_slot_id);
CREATE INDEX idx_reservations_pickup_code ON reservations(pickup_code);
CREATE INDEX idx_reservations_active ON reservations(status) WHERE status IN ('pending', 'confirmed', 'arrived');
CREATE INDEX idx_reservations_expiring ON reservations(expires_at) WHERE status IN ('confirmed', 'arrived');

-- -----------------------------------------------------
-- TABLE: fuel_dispensing_logs (Automatic fuel tracking)
-- -----------------------------------------------------
CREATE TABLE fuel_dispensing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  fuel_type_id UUID NOT NULL REFERENCES fuel_types(id) ON DELETE CASCADE,
  
  -- Dispensing Details
  quantity_dispensed DECIMAL(10, 2) NOT NULL CHECK (quantity_dispensed > 0),
  price_per_liter DECIMAL(10, 2) NOT NULL CHECK (price_per_liter > 0),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount > 0),
  
  -- Cost & Profit
  cost_per_liter DECIMAL(10, 2) CHECK (cost_per_liter > 0),
  gross_profit DECIMAL(10, 2),
  
  -- Operator
  dispensed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Pump Information
  pump_number INTEGER CHECK (pump_number > 0),
  
  -- Timestamps
  dispensed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Metadata
  notes TEXT
);

COMMENT ON TABLE fuel_dispensing_logs IS 'Automatic logging of all fuel dispensing activities';

CREATE INDEX idx_dispensing_station_date ON fuel_dispensing_logs(station_id, dispensed_at DESC);
CREATE INDEX idx_dispensing_fuel_type ON fuel_dispensing_logs(fuel_type_id, dispensed_at DESC);

-- -----------------------------------------------------
-- TABLE: notifications (Enhanced)
-- -----------------------------------------------------
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification Details
  type TEXT NOT NULL CHECK (type IN ('reservation', 'fuel_low', 'fuel_delivery', 'slot_full', 'expiration_warning', 'system', 'promotion')),
  title TEXT NOT NULL CHECK (length(title) >= 1),
  message TEXT NOT NULL CHECK (length(message) >= 1),
  
  -- Status
  is_read BOOLEAN DEFAULT false NOT NULL,
  read_at TIMESTAMPTZ,
  
  -- Relationships
  related_id UUID,
  related_type TEXT CHECK (related_type IN ('reservation', 'station', 'delivery', 'slot') OR related_type IS NULL),
  
  -- Priority
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  
  -- Action
  action_url TEXT,
  action_label TEXT
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = false;

-- -----------------------------------------------------
-- TABLE: payment_transactions
-- -----------------------------------------------------
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  
  -- Payment Details
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Telebirr', 'Chapa', 'Cash')),
  transaction_reference TEXT UNIQUE NOT NULL,
  
  -- Gateway Response
  gateway_transaction_id TEXT,
  gateway_response JSONB,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'refunded')),
  
  -- Timestamps
  initiated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0),
  
  -- Refund
  refund_amount DECIMAL(10, 2) CHECK (refund_amount >= 0 AND refund_amount <= amount),
  refund_reason TEXT
);

CREATE INDEX idx_payment_reservation ON payment_transactions(reservation_id);
CREATE INDEX idx_payment_reference ON payment_transactions(transaction_reference);

-- -----------------------------------------------------
-- TABLE: reviews
-- -----------------------------------------------------
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  
  -- Review
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  
  -- Detailed Ratings
  service_rating INTEGER CHECK (service_rating BETWEEN 1 AND 5 OR service_rating IS NULL),
  speed_rating INTEGER CHECK (speed_rating BETWEEN 1 AND 5 OR speed_rating IS NULL),
  fuel_quality_rating INTEGER CHECK (fuel_quality_rating BETWEEN 1 AND 5 OR fuel_quality_rating IS NULL),
  
  -- Moderation
  is_visible BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT unique_review_per_reservation UNIQUE (reservation_id)
);

CREATE INDEX idx_reviews_station ON reviews(station_id, created_at DESC) WHERE is_visible = true;

-- -----------------------------------------------------
-- TABLE: system_activity (Audit logs)
-- -----------------------------------------------------
CREATE TABLE system_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_role TEXT,
  
  -- Action
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('auth', 'reservation', 'fuel', 'station', 'delivery', 'system')),
  
  -- Context
  metadata JSONB,
  
  -- Result
  success BOOLEAN DEFAULT true,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_activity_user_date ON system_activity(user_id, created_at DESC);
CREATE INDEX idx_activity_category ON system_activity(category, created_at DESC);

-- =====================================================
-- STEP 3: CREATE VIEWS FOR ANALYTICS
-- =====================================================

-- View: Station Dashboard Overview
CREATE OR REPLACE VIEW station_dashboard_overview AS
SELECT 
  s.id as station_id,
  s.name as station_name,
  s.owner_id,
  u.full_name as owner_name,
  
  -- Today's Stats
  COUNT(DISTINCT CASE WHEN r.created_at >= CURRENT_DATE THEN r.id END) as today_reservations,
  COUNT(DISTINCT CASE WHEN r.created_at >= CURRENT_DATE AND r.status = 'completed' THEN r.id END) as today_completed,
  COALESCE(SUM(CASE WHEN r.created_at >= CURRENT_DATE AND r.status = 'completed' THEN r.total_price END), 0) as today_revenue,
  
  -- Current Status
  COUNT(DISTINCT CASE WHEN r.status IN ('confirmed', 'arrived') THEN r.id END) as active_reservations,
  
  -- Fuel Inventory
  json_agg(DISTINCT jsonb_build_object(
    'fuel_type', ft.name,
    'current_stock', sfi.current_stock,
    'is_available', sfi.is_available,
    'status', CASE 
      WHEN sfi.current_stock <= sfi.minimum_stock_threshold THEN 'low'
      WHEN sfi.current_stock > sfi.minimum_stock_threshold * 2 THEN 'good'
      ELSE 'moderate'
    END
  )) FILTER (WHERE ft.id IS NOT NULL) as fuel_inventory,
  
  -- Overall Stats
  s.average_rating,
  s.total_reviews,
  s.number_of_pumps,
  s.is_active,
  s.is_verified

FROM stations s
LEFT JOIN users u ON s.owner_id = u.id
LEFT JOIN reservations r ON s.id = r.station_id
LEFT JOIN station_fuel_inventory sfi ON s.id = sfi.station_id
LEFT JOIN fuel_types ft ON sfi.fuel_type_id = ft.id
GROUP BY s.id, u.full_name;

COMMENT ON VIEW station_dashboard_overview IS 'Real-time dashboard overview for station owners';

-- =====================================================
-- COMPLETE SCHEMA CREATED!
-- =====================================================
-- Next: Run RLS policies and functions scripts
-- =====================================================
