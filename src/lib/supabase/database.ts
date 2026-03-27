// =====================================================
// DATABASE SERVICES - PRODUCTION READY
// =====================================================
// Complete database integration with error handling
// All CRUD operations for QuickFuel Advanced System
// =====================================================

import { supabase } from './client';
import { notifyError, logError } from '../utils/notifications';
import type {
  User,
  Station,
  FuelType,
  TimeSlot,
  Reservation,
  StationFuelInventory,
  FuelDelivery,
  Notification,
  PaymentTransaction,
  Review,
  SystemActivity,
  FuelDispensingLog,
  CreateReservationFormData,
  CreateStationFormData,
  RequestFuelDeliveryFormData,
} from '../../types/advanced';

// =====================================================
// USER SERVICES
// =====================================================

export const userService = {
  /**
   * Get current user profile
   */
  async getCurrentUserProfile(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logError('getCurrentUserProfile', error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      logError('updateProfile', error);
      notifyError('Failed to update profile', error);
      return false;
    }
  },

  /**
   * Get all users (Admin only)
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('getAllUsers', error);
      notifyError('Failed to load users', error);
      return [];
    }
  },

  /**
   * Get operators for a station (Station Owner)
   */
  async getStationOperators(stationId: string): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'operator')
        .eq('station_id', stationId)
        .order('hired_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('getStationOperators', error);
      notifyError('Failed to load operators', error);
      return [];
    }
  },

  /**
   * Create operator account
   */
  async createOperator(operatorData: {
    email: string;
    full_name: string;
    phone: string;
    station_id: string;
  }): Promise<boolean> {
    try {
      // Generate temporary password
      const tempPassword = `QF${Math.random().toString(36).slice(-8)}!`;

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: operatorData.email,
        password: tempPassword,
        options: {
          data: {
            full_name: operatorData.full_name,
            phone: operatorData.phone,
            role: 'operator',
          },
        },
      });

      if (authError) throw authError;

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: operatorData.email,
          full_name: operatorData.full_name,
          phone: operatorData.phone,
          role: 'operator',
          station_id: operatorData.station_id,
          operator_status: 'active',
          hired_date: new Date().toISOString().split('T')[0],
        });

      if (profileError) throw profileError;

      // Send credentials email (would be implemented with email service)
      // For now, log the password (in production, send email)
      if (import.meta.env.DEV) {
        console.log(`Operator created: ${operatorData.email} / ${tempPassword}`);
      }

      return true;
    } catch (error) {
      logError('createOperator', error);
      notifyError('Failed to create operator', error);
      return false;
    }
  },

  /**
   * Update operator status
   */
  async updateOperatorStatus(
    operatorId: string,
    status: 'active' | 'blocked' | 'pending'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ operator_status: status })
        .eq('id', operatorId);

      if (error) throw error;
      return true;
    } catch (error) {
      logError('updateOperatorStatus', error);
      notifyError('Failed to update operator status', error);
      return false;
    }
  },
};

// =====================================================
// FUEL TYPE SERVICES
// =====================================================

export const fuelTypeService = {
  /**
   * Get all active fuel types
   */
  async getActiveFuelTypes(): Promise<FuelType[]> {
    try {
      const { data, error } = await supabase
        .from('fuel_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('getActiveFuelTypes', error);
      notifyError('Failed to load fuel types', error);
      return [];
    }
  },

  /**
   * Get all fuel types (Admin)
   */
  async getAllFuelTypes(): Promise<FuelType[]> {
    try {
      const { data, error } = await supabase
        .from('fuel_types')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('getAllFuelTypes', error);
      return [];
    }
  },

  /**
   * Update fuel type price
   */
  async updateFuelPrice(
    fuelTypeId: string,
    newPrice: number,
    updatedBy: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('fuel_types')
        .update({
          base_price_per_liter: newPrice,
          updated_by: updatedBy,
          updated_at: new Date().toISOString(),
        })
        .eq('id', fuelTypeId);

      if (error) throw error;
      return true;
    } catch (error) {
      logError('updateFuelPrice', error);
      notifyError('Failed to update fuel price', error);
      return false;
    }
  },
};

// =====================================================
// STATION SERVICES
// =====================================================

export const stationService = {
  /**
   * Get all active verified stations
   */
  async getActiveStations(): Promise<Station[]> {
    try {
      const { data, error } = await supabase
        .from('stations')
        .select(`
          *,
          owner:users!stations_owner_id_fkey(full_name)
        `)
        .eq('is_active', true)
        .eq('is_verified', true)
        .order('name');

      if (error) throw error;
      
      return (data || []).map((station: any) => ({
        ...station,
        owner_name: station.owner?.full_name,
      }));
    } catch (error) {
      logError('getActiveStations', error);
      notifyError('Failed to load stations', error);
      return [];
    }
  },

  /**
   * Get all stations (Admin)
   */
  async getAllStations(): Promise<Station[]> {
    try {
      const { data, error } = await supabase
        .from('stations')
        .select(`
          *,
          owner:users!stations_owner_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((station: any) => ({
        ...station,
        owner_name: station.owner?.full_name,
      }));
    } catch (error) {
      logError('getAllStations', error);
      return [];
    }
  },

  /**
   * Get stations by owner
   */
  async getOwnerStations(ownerId: string): Promise<Station[]> {
    try {
      const { data, error } = await supabase
        .from('stations')
        .select('*')
        .eq('owner_id', ownerId)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('getOwnerStations', error);
      return [];
    }
  },

  /**
   * Get operator's station
   */
  async getOperatorStation(userId: string): Promise<Station | null> {
    try {
      // Get user's station_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('station_id')
        .eq('id', userId)
        .single();

      if (userError || !userData?.station_id) return null;

      const { data, error } = await supabase
        .from('stations')
        .select('*')
        .eq('id', userData.station_id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logError('getOperatorStation', error);
      return null;
    }
  },

  /**
   * Create station
   */
  async createStation(stationData: CreateStationFormData): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('stations')
        .insert({
          name: stationData.name,
          address: stationData.address,
          phone: stationData.phone,
          latitude: stationData.latitude,
          longitude: stationData.longitude,
          operating_days: stationData.operating_days,
          opening_time: stationData.opening_time,
          closing_time: stationData.closing_time,
          is_24_hours: stationData.is_24_hours,
          number_of_pumps: stationData.number_of_pumps,
          vehicles_per_pump_per_slot: stationData.vehicles_per_pump_per_slot,
          business_license_number: stationData.business_license_number,
          operating_license_number: stationData.operating_license_number,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      logError('createStation', error);
      notifyError('Failed to create station', error);
      return null;
    }
  },

  /**
   * Update station
   */
  async updateStation(stationId: string, updates: Partial<Station>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stations')
        .update(updates)
        .eq('id', stationId);

      if (error) throw error;
      return true;
    } catch (error) {
      logError('updateStation', error);
      notifyError('Failed to update station', error);
      return false;
    }
  },

  /**
   * Verify station
   */
  async verifyStation(stationId: string, verifiedBy: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stations')
        .update({
          is_verified: true,
          is_active: true,
          verified_by: verifiedBy,
          verification_date: new Date().toISOString(),
        })
        .eq('id', stationId);

      if (error) throw error;
      return true;
    } catch (error) {
      logError('verifyStation', error);
      notifyError('Failed to verify station', error);
      return false;
    }
  },

  /**
   * Generate time slots for station
   */
  async generateTimeSlots(stationId: string, daysAhead: number = 14): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('generate_time_slots_for_station', {
        p_station_id: stationId,
        p_days_ahead: daysAhead,
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      logError('generateTimeSlots', error);
      notifyError('Failed to generate time slots', error);
      return 0;
    }
  },
};

// =====================================================
// FUEL INVENTORY SERVICES
// =====================================================

export const inventoryService = {
  /**
   * Get station fuel inventory
   */
  async getStationInventory(stationId: string): Promise<StationFuelInventory[]> {
    try {
      const { data, error } = await supabase
        .from('station_fuel_inventory')
        .select(`
          *,
          fuel_type:fuel_types(name, code, base_price_per_liter, color_code)
        `)
        .eq('station_id', stationId)
        .order('fuel_type(name)');

      if (error) throw error;
      
      return (data || []).map((inv: any) => ({
        ...inv,
        fuel_type_name: inv.fuel_type?.name,
        fuel_type_code: inv.fuel_type?.code,
        fuel_type_color: inv.fuel_type?.color_code,
        effective_price: inv.custom_price_per_liter || inv.fuel_type?.base_price_per_liter,
        stock_status: 
          inv.current_stock <= inv.minimum_stock_threshold ? 'low' :
          inv.current_stock > inv.minimum_stock_threshold * 2 ? 'good' : 'moderate',
      }));
    } catch (error) {
      logError('getStationInventory', error);
      return [];
    }
  },

  /**
   * Update inventory
   */
  async updateInventory(
    inventoryId: string,
    updates: Partial<StationFuelInventory>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('station_fuel_inventory')
        .update(updates)
        .eq('id', inventoryId);

      if (error) throw error;
      return true;
    } catch (error) {
      logError('updateInventory', error);
      notifyError('Failed to update inventory', error);
      return false;
    }
  },

  /**
   * Add fuel type to station inventory
   */
  async addFuelToStation(
    stationId: string,
    fuelTypeId: string,
    initialStock: number,
    minThreshold: number,
    maxCapacity: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('station_fuel_inventory')
        .insert({
          station_id: stationId,
          fuel_type_id: fuelTypeId,
          current_stock: initialStock,
          minimum_stock_threshold: minThreshold,
          maximum_capacity: maxCapacity,
          is_available: initialStock > minThreshold,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      logError('addFuelToStation', error);
      notifyError('Failed to add fuel to station', error);
      return false;
    }
  },
};

// Continue in next file due to length...
