export interface Station {
  id: string;
  name: string;
  distance: number;
  queueLength: 'Short' | 'Medium' | 'Long';
  petrolAvailable: boolean;
  dieselAvailable: boolean;
  waitTime: number;
  latitude: number;
  longitude: number;
  address?: string;
  operatorId?: string;
  verified?: boolean;
  petrolStock?: number;
  dieselStock?: number;
  operatingHours?: string;
  phone?: string;
}

export type UserRole = 'driver' | 'operator' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  address?: string;
  joinedDate: string;
  isActive: boolean;
  // Driver-specific
  vehicleModel?: string;
  plateNumber?: string;
  preferredFuelType?: 'Petrol' | 'Diesel';
  licenseNumber?: string;
  // Operator-specific
  stationId?: string;
  stationName?: string;
  businessLicense?: string;
  // Admin-specific
  employeeId?: string;
  department?: string;
}

export interface Reservation {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  stationId: string;
  stationName: string;
  date: string;
  timeSlot: string;
  fuelType: 'Petrol' | 'Diesel';
  quantity: number;
  totalCost: number;
  pickupCode: string;
  qrCode: string;
  status: 'confirmed' | 'completed' | 'cancelled' | 'pending';
  paymentMethod: 'Telebirr' | 'Chapa';
  distance: number;
  createdAt: string;
  plateNumber?: string;
}

export interface Notification {
  id: string;
  type: 'reservation_confirmed' | 'reservation_cancelled' | 'queue_status' | 'payment_success' | 'feedback_reply' | 'station_verified' | 'system_alert' | 'fuel_update';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  recipientRole: UserRole;
}

export interface SystemActivity {
  id: string;
  type: 'user_registered' | 'station_verified' | 'reservation_made' | 'fuel_updated' | 'queue_reported' | 'payment_processed' | 'user_deactivated';
  description: string;
  actor: string;
  timestamp: string;
  details?: string;
}

export interface ReservationData {
  station: Station;
  date: string;
  timeSlot: string;
  fuelType: 'Petrol' | 'Diesel';
  quantity: number;
  paymentMethod: 'Telebirr' | 'Chapa' | null;
}

export interface QueueReport {
  id: string;
  stationId: string;
  stationName: string;
  reportedBy: string;
  queueLength: 'Short' | 'Medium' | 'Long';
  timestamp: string;
  comment?: string;
}

export interface FuelPrice {
  id: string;
  fuelType: 'Petrol' | 'Diesel';
  pricePerLiter: number;
  effectiveFrom: string;
  updatedBy: string;
  updatedAt: string;
}

export interface FuelAnalytics {
  id?: string;
  stationId: string;
  stationName: string;
  fuelType: 'Petrol' | 'Diesel';
  totalAvailable: number;
  totalDispensed: number;
  digitalDispensed: number;
  lastUpdated: string;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  user: User;
  expires_at: number;
}