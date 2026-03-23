// =====================================================
// QUICKFUEL ADVANCED SYSTEM - TYPE DEFINITIONS
// =====================================================
// Complete TypeScript types for the advanced digital system
// =====================================================

// =====================================================
// USER TYPES
// =====================================================

export type UserRole = 'driver' | 'operator' | 'station_owner' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  
  // Driver-specific
  address?: string;
  vehicle_model?: string;
  plate_number?: string;
  preferred_fuel_type?: string;
  license_number?: string;
  
  // Operator-specific
  station_id?: string;
  operator_status?: 'active' | 'blocked' | 'pending';
  hired_date?: string;
  
  // Station Owner-specific
  business_license_number?: string;
  tax_identification_number?: string;
  business_address?: string;
  
  // Admin-specific
  employee_id?: string;
  department?: string;
  
  // Profile
  profile_picture_url?: string;
  notification_preferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

// =====================================================
// FUEL TYPES
// =====================================================

export interface FuelType {
  id: string;
  name: string; // Petrol, Diesel, Benzene, Premium Gasoline, Kerosene
  code: string; // PET, DIS, BEN, PRM, KER
  description?: string;
  base_price_per_liter: number;
  is_active: boolean;
  effective_from: string;
  updated_by: string;
  updated_at: string;
  color_code?: string; // For UI display
  density?: number;
  octane_rating?: number;
}

// =====================================================
// STATION TYPES
// =====================================================

export interface Station {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  
  // Ownership
  owner_id?: string;
  owner_name?: string; // Populated from join
  
  // Operating Schedule
  operating_days: string[]; // ["Monday", "Tuesday", ...]
  opening_time: string; // "06:00"
  closing_time: string; // "22:00"
  is_24_hours: boolean;
  
  // Capacity Configuration
  number_of_pumps: number;
  vehicles_per_pump_per_slot: number;
  
  // License & Documentation
  business_license_number: string;
  operating_license_number?: string;
  environmental_clearance_number?: string;
  fire_safety_certificate_number?: string;
  license_expiry_date?: string;
  
  // Status
  is_verified: boolean;
  is_active: boolean;
  verification_date?: string;
  verified_by?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Metadata
  station_image_url?: string;
  amenities: string[]; // ["restroom", "car_wash", "shop", "atm", "wifi"]
  average_rating: number;
  total_reviews: number;
  
  // Calculated/Display fields
  distance?: number;
  fuel_inventory?: StationFuelInventory[];
}

// =====================================================
// FUEL INVENTORY TYPES
// =====================================================

export interface StationFuelInventory {
  id: string;
  station_id: string;
  fuel_type_id: string;
  
  // Populated from joins
  fuel_type_name?: string;
  fuel_type_code?: string;
  fuel_type_color?: string;
  
  // Inventory
  current_stock: number; // in liters
  minimum_stock_threshold: number;
  maximum_capacity: number;
  is_available: boolean;
  
  // Pricing
  custom_price_per_liter?: number; // If null, uses base_price
  effective_price?: number; // Calculated from custom or base
  
  // Timestamps
  last_refilled_at?: string;
  updated_at: string;
  
  // Status
  stock_status?: 'low' | 'moderate' | 'good';
}

// =====================================================
// FUEL DELIVERY TYPES
// =====================================================

export type DeliveryStatus = 'pending' | 'approved' | 'rejected' | 'delivered';

export interface FuelDelivery {
  id: string;
  station_id: string;
  fuel_type_id: string;
  
  // Populated from joins
  station_name?: string;
  fuel_type_name?: string;
  
  // Delivery Information
  delivery_reference: string;
  quantity: number;
  supplier_name: string;
  supplier_contact?: string;
  
  // Status
  status: DeliveryStatus;
  
  // Approval Workflow
  requested_by?: string;
  requested_by_name?: string;
  requested_at: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  
  // Delivery Details
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  delivery_note?: string;
  
  // Financial
  cost_per_liter?: number;
  total_cost?: number;
  invoice_number?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Documents
  delivery_receipt_url?: string;
  invoice_url?: string;
}

// =====================================================
// TIME SLOT TYPES
// =====================================================

export type SlotStatus = 'available' | 'limited' | 'full' | 'closed';

export interface TimeSlot {
  id: string;
  station_id: string;
  slot_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  
  // Capacity
  max_capacity: number;
  current_reservations: number;
  available_spots: number; // Calculated: max_capacity - current_reservations
  
  // Status
  status: SlotStatus;
  
  // Timestamps
  created_at: string;
  
  // Display
  is_past?: boolean;
  is_today?: boolean;
  occupancy_percentage?: number; // For UI progress bars
}

// =====================================================
// RESERVATION TYPES
// =====================================================

export type ReservationStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'arrived' 
  | 'dispensing' 
  | 'completed' 
  | 'cancelled' 
  | 'expired';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'Telebirr' | 'Chapa' | 'Cash';

export interface Reservation {
  id: string;
  
  // Relationships
  driver_id: string;
  station_id: string;
  time_slot_id: string;
  fuel_type_id: string;
  
  // Populated from joins
  driver_name?: string;
  driver_phone?: string;
  driver_plate?: string;
  station_name?: string;
  fuel_type_name?: string;
  slot_date?: string;
  slot_start_time?: string;
  slot_end_time?: string;
  
  // Fuel Details
  quantity: number;
  price_per_liter: number;
  total_price: number;
  
  // Reservation Status
  status: ReservationStatus;
  
  // Payment
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  
  // Pickup Verification
  pickup_code: string; // 6-digit code
  qr_code?: string;
  
  // Expiration
  expires_at: string;
  
  // Lifecycle Timestamps
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  arrived_at?: string;
  dispensing_started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  expired_at?: string;
  
  // Cancellation
  cancellation_reason?: string;
  cancelled_by?: string;
  
  // Operator Actions
  verified_by?: string;
  verified_by_name?: string;
  dispensed_by?: string;
  dispensed_by_name?: string;
  
  // Metadata
  notes?: string;
  driver_rating?: number; // 1-5
  
  // Display
  is_active?: boolean;
  can_cancel?: boolean;
  can_arrive?: boolean;
  time_until_expiry?: string;
}

// =====================================================
// DISPENSING LOG TYPES
// =====================================================

export interface FuelDispensingLog {
  id: string;
  reservation_id: string;
  station_id: string;
  fuel_type_id: string;
  
  // Populated
  station_name?: string;
  fuel_type_name?: string;
  driver_name?: string;
  
  // Dispensing Details
  quantity_dispensed: number;
  price_per_liter: number;
  total_amount: number;
  
  // Cost & Profit
  cost_per_liter?: number;
  gross_profit?: number;
  
  // Operator
  dispensed_by?: string;
  dispensed_by_name?: string;
  
  // Pump
  pump_number?: number;
  
  // Timestamps
  dispensed_at: string;
  
  // Metadata
  notes?: string;
}

// =====================================================
// NOTIFICATION TYPES
// =====================================================

export type NotificationType = 
  | 'reservation' 
  | 'fuel_low' 
  | 'fuel_delivery' 
  | 'slot_full' 
  | 'expiration_warning' 
  | 'system' 
  | 'promotion';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  related_id?: string;
  related_type?: 'reservation' | 'station' | 'delivery' | 'slot';
  priority: NotificationPriority;
  created_at: string;
  expires_at?: string;
  action_url?: string;
  action_label?: string;
}

// =====================================================
// PAYMENT TYPES
// =====================================================

export type PaymentTransactionStatus = 
  | 'pending' 
  | 'processing' 
  | 'success' 
  | 'failed' 
  | 'refunded';

export interface PaymentTransaction {
  id: string;
  reservation_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_reference: string;
  gateway_transaction_id?: string;
  gateway_response?: any;
  status: PaymentTransactionStatus;
  initiated_at: string;
  completed_at?: string;
  refunded_at?: string;
  error_message?: string;
  retry_count: number;
  refund_amount?: number;
  refund_reason?: string;
}

// =====================================================
// REVIEW TYPES
// =====================================================

export interface Review {
  id: string;
  driver_id: string;
  station_id: string;
  reservation_id?: string;
  
  // Populated
  driver_name?: string;
  station_name?: string;
  
  // Review
  rating: number; // 1-5
  comment?: string;
  
  // Detailed Ratings
  service_rating?: number;
  speed_rating?: number;
  fuel_quality_rating?: number;
  
  // Moderation
  is_visible: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// =====================================================
// SYSTEM ACTIVITY TYPES
// =====================================================

export type ActivityCategory = 
  | 'auth' 
  | 'reservation' 
  | 'fuel' 
  | 'station' 
  | 'delivery' 
  | 'system';

export interface SystemActivity {
  id: string;
  user_id?: string;
  user_role?: string;
  user_name?: string;
  action: string;
  description: string;
  category: ActivityCategory;
  metadata?: any;
  success: boolean;
  created_at: string;
}

// =====================================================
// ANALYTICS TYPES
// =====================================================

export interface StationDashboardOverview {
  station_id: string;
  station_name: string;
  owner_id?: string;
  owner_name?: string;
  
  // Today's Stats
  today_reservations: number;
  today_completed: number;
  today_revenue: number;
  
  // Current Status
  active_reservations: number;
  
  // Fuel Inventory
  fuel_inventory: Array<{
    fuel_type: string;
    current_stock: number;
    is_available: boolean;
    status: 'low' | 'moderate' | 'good';
  }>;
  
  // Overall Stats
  average_rating: number;
  total_reviews: number;
  number_of_pumps: number;
  is_active: boolean;
  is_verified: boolean;
}

export interface FuelAnalytics {
  station_id?: string;
  station_name?: string;
  fuel_type_id?: string;
  fuel_type_name?: string;
  period: 'today' | 'week' | 'month' | 'custom';
  
  // Metrics
  total_dispensed: number; // liters
  total_revenue: number;
  total_profit?: number;
  transaction_count: number;
  
  // Averages
  average_per_transaction: number;
  average_price_per_liter: number;
  
  // Trends (for charts)
  daily_breakdown?: Array<{
    date: string;
    quantity: number;
    revenue: number;
  }>;
  
  hourly_breakdown?: Array<{
    hour: number;
    quantity: number;
    revenue: number;
  }>;
}

export interface ReservationAnalytics {
  total_reservations: number;
  completed_reservations: number;
  cancelled_reservations: number;
  expired_reservations: number;
  completion_rate: number; // percentage
  cancellation_rate: number; // percentage
  average_quantity: number;
  average_value: number;
  
  // By fuel type
  by_fuel_type?: Array<{
    fuel_type: string;
    count: number;
    total_quantity: number;
    total_revenue: number;
  }>;
  
  // By time slot
  by_hour?: Array<{
    hour: number;
    count: number;
  }>;
}

// =====================================================
// FORM DATA TYPES
// =====================================================

export interface CreateStationFormData {
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  
  // Owner Assignment
  owner_email?: string;
  owner_name?: string;
  owner_phone?: string;
  owner_business_license?: string;
  
  // Operating Schedule
  operating_days: string[];
  opening_time: string;
  closing_time: string;
  is_24_hours: boolean;
  
  // Capacity
  number_of_pumps: number;
  vehicles_per_pump_per_slot: number;
  
  // License
  business_license_number: string;
  operating_license_number?: string;
  
  // Initial Fuel Inventory
  initial_inventory?: Array<{
    fuel_type_id: string;
    initial_stock: number;
    minimum_threshold: number;
    maximum_capacity: number;
  }>;
}

export interface CreateReservationFormData {
  station_id: string;
  time_slot_id: string;
  fuel_type_id: string;
  quantity: number;
  payment_method: PaymentMethod;
  notes?: string;
}

export interface RequestFuelDeliveryFormData {
  station_id: string;
  fuel_type_id: string;
  quantity: number;
  supplier_name: string;
  supplier_contact?: string;
  expected_delivery_date: string;
  cost_per_liter?: number;
  invoice_number?: string;
  delivery_note?: string;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface OperatingHours {
  opening_time: string;
  closing_time: string;
  is_24_hours: boolean;
  operating_days: string[];
}

export interface StockAlert {
  station_id: string;
  station_name: string;
  fuel_type_id: string;
  fuel_type_name: string;
  current_stock: number;
  minimum_threshold: number;
  severity: 'warning' | 'critical';
}

// =====================================================
// EXPORT ALL
// =====================================================

export type * from './advanced';
