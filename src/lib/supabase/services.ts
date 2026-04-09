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

  static async createUserViaEdge(userData: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
    role: 'driver' | 'operator' | 'station_owner';
    station_id?: string;
    business_license_number?: string;
    address?: string;
    vehicle_model?: string;
    plate_number?: string;
    preferred_fuel_type?: string;
    license_number?: string;
  }): Promise<{ success: boolean; user_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: userData,
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Unknown error');
      return { success: true, user_id: data.user_id };
    } catch (error: any) {
      console.error('createUserViaEdge error:', error);
      return { success: false, error: error.message };
    }
  }

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
      .select(`
        *,
        owner:owner_id (
          full_name
        )
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(station => ({
      ...station,
      owner_name: station.owner?.full_name || 'Unknown',
    }));
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
    try {
      const { data, error } = await supabase
        .from('stations')
        .update({
          is_verified: true,
          verified_by: verifiedBy,
          verification_date: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Supabase error in verify:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error in verify method:', error);
      throw error;
    }
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
  /**
   * Retrieve all fuel analytics records, enriched with station name and fuel type name.
   * @returns Promise<FuelAnalytics[]> – each record includes stationName and fuelType as strings.
   */
  static async getAll(): Promise<FuelAnalytics[]> {
    const { data, error } = await supabase
      .from('fuel_analytics')
      .select(`
        id,
        station_id,
        fuel_type_id,
        total_available,
        total_dispensed,
        digital_dispensed,
        last_updated,
        station:stations!station_id (name),
        fuel_type:fuel_types!fuel_type_id (name)
      `)
      .order('last_updated', { ascending: false });

    if (error) throw error;

    // Transform to match the FuelAnalytics interface expected by components
    return (data || []).map((item: any) => ({
      id: item.id,
      stationId: item.station_id,
      stationName: item.station?.name || 'Unknown Station',
      fuelType: item.fuel_type?.name || 'Unknown Fuel',
      totalAvailable: item.total_available,
      totalDispensed: item.total_dispensed,
      digitalDispensed: item.digital_dispensed,
      lastUpdated: item.last_updated,
    }));
  }

  /**
   * Retrieve analytics for a specific station, enriched with station name and fuel type name.
   * @param stationId – UUID of the station
   * @returns Promise<FuelAnalytics[]>
   */
  static async getByStation(stationId: string): Promise<FuelAnalytics[]> {
    const { data, error } = await supabase
      .from('fuel_analytics')
      .select(`
        id,
        station_id,
        fuel_type_id,
        total_available,
        total_dispensed,
        digital_dispensed,
        last_updated,
        station:stations!station_id (name),
        fuel_type:fuel_types!fuel_type_id (name)
      `)
      .eq('station_id', stationId)
      .order('last_updated', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      stationId: item.station_id,
      stationName: item.station?.name || 'Unknown Station',
      fuelType: item.fuel_type?.name || 'Unknown Fuel',
      totalAvailable: item.total_available,
      totalDispensed: item.total_dispensed,
      digitalDispensed: item.digital_dispensed,
      lastUpdated: item.last_updated,
    }));
  }

  /**
   * Update (upsert) analytics for a station and fuel type.
   * In version 2, the unique constraint is (station_id, fuel_type_id, analytics_date).
   * This method defaults analytics_date to today if not provided.
   *
   * @param stationId – UUID of the station
   * @param fuelTypeId – UUID of the fuel type (from fuel_types table)
   * @param updates – partial FuelAnalytics fields (e.g., total_dispensed, digital_dispensed)
   * @param analyticsDate – optional date; defaults to today
   * @returns Promise<FuelAnalytics | null>
   */
  static async updateAnalytics(
    stationId: string,
    fuelTypeId: string,
    updates: Partial<{
      total_available: number;
      total_dispensed: number;
      digital_dispensed: number;
    }>,
    analyticsDate: string = new Date().toISOString().split('T')[0]
  ): Promise<FuelAnalytics | null> {
    const { data, error } = await supabase
      .from('fuel_analytics')
      .upsert(
        {
          station_id: stationId,
          fuel_type_id: fuelTypeId,
          analytics_date: analyticsDate,
          ...updates,
          last_updated: new Date().toISOString(),
        },
        {
          onConflict: 'station_id,fuel_type_id,analytics_date',
          ignoreDuplicates: false,
        }
      )
      .select(`
        id,
        station_id,
        fuel_type_id,
        total_available,
        total_dispensed,
        digital_dispensed,
        last_updated,
        station:stations!station_id (name),
        fuel_type:fuel_types!fuel_type_id (name)
      `)
      .single();

    if (error) throw error;

    // Transform to match component expectations
    if (!data) return null;

    return {
      id: data.id,
      stationId: data.station_id,
      stationName: data.station?.name || 'Unknown Station',
      fuelType: data.fuel_type?.name || 'Unknown Fuel',
      totalAvailable: data.total_available,
      totalDispensed: data.total_dispensed,
      digitalDispensed: data.digital_dispensed,
      lastUpdated: data.last_updated,
    };
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
