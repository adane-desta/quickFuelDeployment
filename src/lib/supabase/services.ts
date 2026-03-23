// Data Services Layer - Real Supabase Implementation
import { supabase } from './client';
import {
  User,
  Station,
  Reservation,
  Notification,
  FuelPrice,
  FuelAnalytics,
  QueueReport,
  SystemActivity,
  UserRole,
} from '../../types';

// =====================================================
// USER SERVICES
// =====================================================

export class UserService {
  static async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  static async getByRole(role: UserRole): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role);
    if (error) throw error;
    return data || [];
  }

  static async update(id: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async deactivate(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id);
    return !error;
  }

  static async activate(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('id', id);
    return !error;
  }
}

// =====================================================
// STATION SERVICES
// =====================================================

export class StationService {
  static async getAll(): Promise<Station[]> {
    const { data, error } = await supabase
      .from('stations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<Station | null> {
    const { data, error } = await supabase
      .from('stations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  static async getVerified(): Promise<Station[]> {
    const { data, error } = await supabase
      .from('stations')
      .select('*')
      .eq('is_verified', true);
    if (error) throw error;
    return data || [];
  }

  static async create(station: Omit<Station, 'id'>): Promise<Station> {
    const { data, error } = await supabase
      .from('stations')
      .insert(station)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id: string, updates: Partial<Station>): Promise<Station | null> {
    const { data, error } = await supabase
      .from('stations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async verify(id: string, verifiedBy: string): Promise<Station | null> {
    const { data, error } = await supabase
      .from('stations')
      .update({
        is_verified: true,
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async updateStock(id: string, petrolStock?: number, dieselStock?: number): Promise<Station | null> {
    const updates: any = {};
    if (petrolStock !== undefined) {
      updates.petrol_stock = petrolStock;
      updates.petrol_available = petrolStock > 0;
    }
    if (dieselStock !== undefined) {
      updates.diesel_stock = dieselStock;
      updates.diesel_available = dieselStock > 0;
    }
    return this.update(id, updates);
  }
}

// =====================================================
// RESERVATION SERVICES
// =====================================================

export class ReservationService {
  static async getAll(): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<Reservation | null> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  static async getByDriver(driverId: string): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getByStation(stationId: string): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('station_id', stationId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getByPickupCode(pickupCode: string): Promise<Reservation | null> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('pickup_code', pickupCode)
      .single();
    if (error) throw error;
    return data;
  }

  static async create(reservation: any): Promise<Reservation> {
    // Generate pickup code
    const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();
    const qrCode = `QF-${Date.now()}-${pickupCode}`;

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        ...reservation,
        pickup_code: pickupCode,
        qr_code: qrCode,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async updateStatus(
    id: string,
    status: Reservation['status'],
    additionalData?: Partial<Reservation>
  ): Promise<Reservation | null> {
    const { data, error } = await supabase
      .from('reservations')
      .update({ status, ...additionalData })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async complete(id: string, dispensedBy: string): Promise<Reservation | null> {
    return this.updateStatus(id, 'completed', {
      dispensed_at: new Date().toISOString(),
      dispensed_by: dispensedBy,
    } as any);
  }

  static async cancel(id: string, reason?: string): Promise<Reservation | null> {
    return this.updateStatus(id, 'cancelled', {
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    } as any);
  }
}

// =====================================================
// FUEL PRICE SERVICES
// =====================================================

export class FuelPriceService {
  static async getAll(): Promise<FuelPrice[]> {
    const { data, error } = await supabase
      .from('fuel_types')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getCurrent(): Promise<FuelPrice[]> {
    const { data, error } = await supabase
      .from('fuel_types')
      .select('*')
      .lte('effective_from', new Date().toISOString());
    if (error) throw error;
    return data || [];
  }

  static async update(id: string, updates: Partial<FuelPrice>): Promise<FuelPrice | null> {
    const { data, error } = await supabase
      .from('fuel_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async create(price: Omit<FuelPrice, 'id'>): Promise<FuelPrice> {
    const { data, error } = await supabase
      .from('fuel_typesr')
      .insert(price)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// =====================================================
// FUEL ANALYTICS SERVICES
// =====================================================

export class FuelAnalyticsService {
  static async getAll(): Promise<FuelAnalytics[]> {
    const { data, error } = await supabase
      .from('fuel_analytics')
      .select('*')
      .order('last_updated', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getByStation(stationId: string): Promise<FuelAnalytics[]> {
    const { data, error } = await supabase
      .from('fuel_analytics')
      .select('*')
      .eq('station_id', stationId);
    if (error) throw error;
    return data || [];
  }

  static async updateAnalytics(
    stationId: string,
    fuelType: 'Petrol' | 'Diesel',
    updates: Partial<FuelAnalytics>
  ): Promise<FuelAnalytics | null> {
    // Use upsert to create or update
    const { data, error } = await supabase
      .from('fuel_analytics')
      .upsert(
        {
          station_id: stationId,
          fuel_type: fuelType,
          ...updates,
          last_updated: new Date().toISOString(),
        },
        { onConflict: 'station_id,fuel_type' }
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// =====================================================
// NOTIFICATION SERVICES
// =====================================================

export class NotificationService {
  static async getByUser(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async create(notification: Omit<Notification, 'id'>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async markAsRead(id: string): Promise<Notification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// =====================================================
// QUEUE REPORT SERVICES
// =====================================================

export class QueueReportService {
  static async getAll(): Promise<QueueReport[]> {
    const { data, error } = await supabase
      .from('queue_reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getByStation(stationId: string): Promise<QueueReport[]> {
    const { data, error } = await supabase
      .from('queue_reports')
      .select('*')
      .eq('station_id', stationId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async create(report: Omit<QueueReport, 'id'>): Promise<QueueReport> {
    const { data, error } = await supabase
      .from('queue_reports')
      .insert(report)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// =====================================================
// SYSTEM ACTIVITY SERVICES
// =====================================================

export class SystemActivityService {
  static async getAll(limit = 50): Promise<SystemActivity[]> {
    const { data, error } = await supabase
      .from('system_activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  static async create(activity: Omit<SystemActivity, 'id'>): Promise<SystemActivity> {
    const { data, error } = await supabase
      .from('system_activity')
      .insert(activity)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// Export all services
export const db = {
  users: UserService,
  stations: StationService,
  reservations: ReservationService,
  fuelPrices: FuelPriceService,
  fuelAnalytics: FuelAnalyticsService,
  notifications: NotificationService,
  queueReports: QueueReportService,
  systemActivity: SystemActivityService,
};
