// =====================================================
// DATABASE SERVICES - ADVANCED (Part 2)
// =====================================================
// Time slots, reservations, deliveries, and more
// =====================================================

import { supabase } from './client';
import { notifyError, logError } from '../utils/notifications';
import type {
  TimeSlot,
  Reservation,
  FuelDelivery,
  Notification,
  PaymentTransaction,
  Review,
  SystemActivity,
  FuelDispensingLog,
  CreateReservationFormData,
  RequestFuelDeliveryFormData,
  StationDashboardOverview,
} from '../../types/advanced';

// =====================================================
// TIME SLOT SERVICES
// =====================================================

export const timeSlotService = {
  /**
   * Get available time slots for a station on a specific date
   */
  async getAvailableSlots(stationId: string, date: string): Promise<TimeSlot[]> {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('station_id', stationId)
        .eq('slot_date', date)
        .in('status', ['available', 'limited'])
        .gte('slot_date', new Date().toISOString().split('T')[0]) // Only future dates
        .order('start_time');

      if (error) throw error;
      
      return (data || []).map((slot: any) => ({
        ...slot,
        available_spots: slot.max_capacity - slot.current_reservations,
        occupancy_percentage: (slot.current_reservations / slot.max_capacity) * 100,
        is_past: new Date(`${slot.slot_date}T${slot.end_time}`) < new Date(),
        is_today: slot.slot_date === new Date().toISOString().split('T')[0],
      }));
    } catch (error) {
      logError('getAvailableSlots', error);
      return [];
    }
  },

  /**
   * Get all slots for a station (for owner/operator view)
   */
  async getStationSlots(
    stationId: string,
    startDate: string,
    endDate: string
  ): Promise<TimeSlot[]> {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('station_id', stationId)
        .gte('slot_date', startDate)
        .lte('slot_date', endDate)
        .order('slot_date')
        .order('start_time');

      if (error) throw error;
      
      return (data || []).map((slot: any) => ({
        ...slot,
        available_spots: slot.max_capacity - slot.current_reservations,
        occupancy_percentage: (slot.current_reservations / slot.max_capacity) * 100,
      }));
    } catch (error) {
      logError('getStationSlots', error);
      return [];
    }
  },

  /**
   * Get slot by ID with details
   */
  async getSlotById(slotId: string): Promise<TimeSlot | null> {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('id', slotId)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        available_spots: data.max_capacity - data.current_reservations,
        occupancy_percentage: (data.current_reservations / data.max_capacity) * 100,
      };
    } catch (error) {
      logError('getSlotById', error);
      return null;
    }
  },

 
  async getSlotsForDate(stationId: string, date: string): Promise<TimeSlot[]> {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('station_id', stationId)
        .eq('slot_date', date)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return (data || []).map((slot: any) => ({
        ...slot,
        available_spots: slot.max_capacity - slot.current_reservations,
        occupancy_percentage: (slot.current_reservations / slot.max_capacity) * 100,
      }));
    } catch (error) {
      console.error('getSlotsForDate error:', error);
      return [];
    }
  },
};

// =====================================================
// RESERVATION SERVICES
// =====================================================

export const reservationService = {
  /**
   * Create a new reservation
   */
  async createReservation(reservationData: CreateReservationFormData, driverId: string): Promise<string | null> {
    try {
      // Get slot and fuel details
      const slot = await timeSlotService.getSlotById(reservationData.time_slot_id);
      if (!slot) throw new Error('Invalid time slot');

      // Get fuel price
      const { data: inventory, error: invError } = await supabase
        .from('station_fuel_inventory')
        .select(`
          *,
          fuel_type:fuel_types(base_price_per_liter)
        `)
        .eq('station_id', reservationData.station_id)
        .eq('fuel_type_id', reservationData.fuel_type_id)
        .single();

      if (invError || !inventory) throw new Error('Fuel type not available');

      const pricePerLiter = inventory.custom_price_per_liter || inventory.fuel_type.base_price_per_liter;
      const totalPrice = pricePerLiter * reservationData.quantity;

      // Generate pickup code
      const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Calculate expiration
      const expiresAt = new Date(`${slot.slot_date}T${slot.end_time}`);
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Add 15 min grace period

      // Create reservation
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          driver_id: driverId,
          station_id: reservationData.station_id,
          time_slot_id: reservationData.time_slot_id,
          fuel_type_id: reservationData.fuel_type_id,
          quantity: reservationData.quantity,
          price_per_liter: pricePerLiter,
          total_price: totalPrice,
          payment_method: reservationData.payment_method,
          pickup_code: pickupCode,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
          payment_status: 'pending',
          notes: reservationData.notes,
        })
        .select()
        .single();

      if (error) throw error;

      // Create payment transaction
      await supabase.from('payment_transactions').insert({
        reservation_id: data.id,
        amount: totalPrice,
        payment_method: reservationData.payment_method,
        transaction_reference: `TXN-${Date.now()}-${pickupCode}`,
        status: 'pending',
      });

      return data.id;
    } catch (error) {
      logError('createReservation', error);
      notifyError('Failed to create reservation', error);
      return null;
    }
  },

  /**
   * Get driver's reservations
   */
  async getDriverReservations(driverId: string): Promise<Reservation[]> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          station:stations(name, address, phone),
          fuel_type:fuel_types(name, code),
          time_slot:time_slots(slot_date, start_time, end_time)
        `)
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((res: any) => ({
        ...res,
        station_name: res.station?.name,
        fuel_type_name: res.fuel_type?.name,
        slot_date: res.time_slot?.slot_date,
        slot_start_time: res.time_slot?.start_time,
        slot_end_time: res.time_slot?.end_time,
        is_active: ['pending', 'confirmed', 'arrived'].includes(res.status),
        can_cancel: ['pending', 'confirmed'].includes(res.status),
      }));
    } catch (error) {
      logError('getDriverReservations', error);
      return [];
    }
  },

  /**
   * Get station reservations
   */
  async getStationReservations(
    stationId: string,
    filters?: { status?: string; date?: string }
  ): Promise<Reservation[]> {
    try {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          driver:users!reservations_driver_id_fkey(full_name, phone, plate_number),
          fuel_type:fuel_types(name, code),
          time_slot:time_slots(slot_date, start_time, end_time)
        `)
        .eq('station_id', stationId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.date) {
        query = query.eq('time_slot.slot_date', filters.date);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((res: any) => ({
        ...res,
        driver_name: res.driver?.full_name,
        driver_phone: res.driver?.phone,
        driver_plate: res.driver?.plate_number,
        fuel_type_name: res.fuel_type?.name,
        slot_date: res.time_slot?.slot_date,
        slot_start_time: res.time_slot?.start_time,
        slot_end_time: res.time_slot?.end_time,
      }));
    } catch (error) {
      logError('getStationReservations', error);
      return [];
    }
  },

  /**
   * Verify pickup code
   */
  async verifyPickupCode(pickupCode: string, stationId: string): Promise<Reservation | null> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          driver:users!reservations_driver_id_fkey(full_name, phone, plate_number),
          fuel_type:fuel_types(name, code),
          time_slot:time_slots(slot_date, start_time, end_time)
        `)
        .eq('pickup_code', pickupCode)
        .eq('station_id', stationId)
        .single();

      if (error) {
        // No reservation found
        return null;
      }

      // Return the reservation with all its current status
      // Let the calling component decide how to handle different statuses
      return {
        ...data,
        driver_name: data.driver?.full_name,
        driver_phone: data.driver?.phone,
        driver_plate: data.driver?.plate_number,
        fuel_type_name: data.fuel_type?.name,
        slot_date: data.time_slot?.slot_date,
        slot_start_time: data.time_slot?.start_time,
        slot_end_time: data.time_slot?.end_time,
      };
    } catch (error) {
      logError('verifyPickupCode', error);
      return null;
    }
  },

  /**
   * Update reservation status
   */
  async updateReservationStatus(
    reservationId: string,
    status: string,
    operatorId?: string
  ): Promise<boolean> {
    console.log('updateReservationStatus called with:', { reservationId, status, operatorId });
    try {
      const updates: any = { status };

      if (status === 'arrived') {
        updates.arrived_at = new Date().toISOString();
      } else if (status === 'dispensing') {
        updates.dispensing_started_at = new Date().toISOString();
        if (operatorId) updates.verified_by = operatorId;
      } else if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
        if (operatorId) updates.dispensed_by = operatorId;
      } else if (status === 'cancelled') {
        updates.cancelled_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', reservationId)
        .select()
      console.log('Supabase response:', { data, error });
      if (error) throw error;
      return true;
    } catch (error) {
      logError('updateReservationStatus', error);
      notifyError('Failed to update reservation', error);
      return false;
    }
  },

  /**
   * Cancel reservation
   */
  async cancelReservation(
    reservationId: string,
    reason: string,
    cancelledBy: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
          cancelled_by: cancelledBy,
        })
        .eq('id', reservationId);

      if (error) throw error;
      return true;
    } catch (error) {
      logError('cancelReservation', error);
      notifyError('Failed to cancel reservation', error);
      return false;
    }
  },

  /**
   * Confirm payment
   */
  async confirmPayment(reservationId: string, transactionId: string): Promise<boolean> {
    try {
      // Update reservation
      await supabase
        .from('reservations')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', reservationId);

      // Update transaction
      await supabase
        .from('payment_transactions')
        .update({
          status: 'success',
          completed_at: new Date().toISOString(),
        })
        .eq('reservation_id', reservationId);

      return true;
    } catch (error) {
      logError('confirmPayment', error);
      notifyError('Failed to confirm payment', error);
      return false;
    }
  },
};

// =====================================================
// FUEL DELIVERY SERVICES
// =====================================================

export const deliveryService = {
  /**
   * Request fuel delivery
   */
  async requestDelivery(
    deliveryData: RequestFuelDeliveryFormData,
    requestedBy: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('fuel_deliveries')
        .insert({
          station_id: deliveryData.station_id,
          fuel_type_id: deliveryData.fuel_type_id,
          quantity: deliveryData.quantity,
          supplier_name: deliveryData.supplier_name,
          supplier_contact: deliveryData.supplier_contact,
          expected_delivery_date: deliveryData.expected_delivery_date,
          cost_per_liter: deliveryData.cost_per_liter,
          total_cost: deliveryData.cost_per_liter ? deliveryData.cost_per_liter * deliveryData.quantity : null,
          invoice_number: deliveryData.invoice_number,
          delivery_note: deliveryData.delivery_note,
          delivery_reference: `DEL-${Date.now()}`,
          status: 'pending',
          requested_by: requestedBy,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      logError('requestDelivery', error);
      notifyError('Failed to request delivery', error);
      return false;
    }
  },

  /**
   * Get station deliveries
   */
  async getStationDeliveries(stationId: string): Promise<FuelDelivery[]> {
    try {
      const { data, error } = await supabase
        .from('fuel_deliveries')
        .select(`
          *,
          fuel_type:fuel_types(name, code),
          requester:users!fuel_deliveries_requested_by_fkey(full_name),
          approver:users!fuel_deliveries_approved_by_fkey(full_name)
        `)
        .eq('station_id', stationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((del: any) => ({
        ...del,
        fuel_type_name: del.fuel_type?.name,
        requested_by_name: del.requester?.full_name,
        approved_by_name: del.approver?.full_name,
      }));
    } catch (error) {
      logError('getStationDeliveries', error);
      return [];
    }
  },

  /**
   * Get pending deliveries (Admin)
   */
  async getPendingDeliveries(): Promise<FuelDelivery[]> {
    try {
      const { data, error } = await supabase
        .from('fuel_deliveries')
        .select(`
          *,
          station:stations(name),
          fuel_type:fuel_types(name, code),
          requester:users!fuel_deliveries_requested_by_fkey(full_name)
        `)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((del: any) => ({
        ...del,
        station_name: del.station?.name,
        fuel_type_name: del.fuel_type?.name,
        requested_by_name: del.requester?.full_name,
      }));
    } catch (error) {
      logError('getPendingDeliveries', error);
      return [];
    }
  },

  /**
   * Approve delivery
   */
  async approveDelivery(deliveryId: string, approvedBy: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('fuel_deliveries')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
        })
        .eq('id', deliveryId);

      if (error) throw error;
      return true;
    } catch (error) {
      logError('approveDelivery', error);
      notifyError('Failed to approve delivery', error);
      return false;
    }
  },

  /**
   * Reject delivery
   */
  async rejectDelivery(
    deliveryId: string,
    reason: string,
    rejectedBy: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('fuel_deliveries')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          approved_by: rejectedBy,
          approved_at: new Date().toISOString(),
        })
        .eq('id', deliveryId);

      if (error) throw error;
      return true;
    } catch (error) {
      logError('rejectDelivery', error);
      notifyError('Failed to reject delivery', error);
      return false;
    }
  },

  /**
   * Mark delivery as delivered
   */
  async markDelivered(deliveryId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('fuel_deliveries')
        .update({
          status: 'delivered',
          actual_delivery_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', deliveryId);

      if (error) throw error;
      return true;
    } catch (error) {
      logError('markDelivered', error);
      notifyError('Failed to mark delivery as delivered', error);
      return false;
    }
  },
};

// =====================================================
// NOTIFICATION SERVICES
// =====================================================

export const notificationService = {
  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('getUserNotifications', error);
      return [];
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      logError('markAsRead', error);
      return false;
    }
  },

  /**
   * Mark all as read
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      logError('markAllAsRead', error);
      return false;
    }
  },
};

// =====================================================
// ANALYTICS SERVICES
// =====================================================

export const analyticsService = {
  /**
   * Get station dashboard overview
   */
  async getStationDashboard(stationId: string): Promise<StationDashboardOverview | null> {
    try {
      const { data, error } = await supabase
        .from('station_dashboard_overview')
        .select('*')
        .eq('station_id', stationId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logError('getStationDashboard', error);
      return null;
    }
  },

  /**
   * Get dispensing logs
   */
  async getDispensingLogs(
    stationId: string,
    startDate: string,
    endDate: string
  ): Promise<FuelDispensingLog[]> {
    try {
      const { data, error } = await supabase
        .from('fuel_dispensing_logs')
        .select(`
          *,
          fuel_type:fuel_types(name, code),
          operator:users!fuel_dispensing_logs_dispensed_by_fkey(full_name)
        `)
        .eq('station_id', stationId)
        .gte('dispensed_at', startDate)
        .lte('dispensed_at', endDate)
        .order('dispensed_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((log: any) => ({
        ...log,
        fuel_type_name: log.fuel_type?.name,
        dispensed_by_name: log.operator?.full_name,
      }));
    } catch (error) {
      logError('getDispensingLogs', error);
      return [];
    }
  },

  /**
   * Record fuel analytics entry
   */
  async recordFuelAnalytics(
    stationId: string,
    fuelType: string,
    quantityDispensed: number,
    revenue: number,
    recordedBy: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('fuel_analytics')
        .insert({
          station_id: stationId,
          fuel_type: fuelType,
          quantity_dispensed: quantityDispensed,
          revenue: revenue,
          recorded_by: recordedBy,
          recorded_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      logError('recordFuelAnalytics', error);
      return false;
    }
  },

  /**
   * Log system activity
   */
  async logActivity(
    userId: string,
    userRole: string,
    action: string,
    description: string,
    category: string = 'general',
    metadata?: any
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('system_activity')
        .insert({
          user_id: userId,
          user_role: userRole,
          action: action,
          description: description,
          category: category,
          metadata: metadata,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      logError('logActivity', error);
      return false;
    }
  },
};

// =====================================================
// FUEL DISPENSING SERVICE
// =====================================================

export const fuelDispensingService = {
  /**
   * Complete fuel dispensing process with all side effects
   * This is the comprehensive function that handles everything when fuel is dispensed
   */
  async completeFuelDispensing(
    reservationId: string,
    operatorId: string,
    stationId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Get reservation details
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .select(`
          *,
          driver:users!reservations_driver_id_fkey(full_name, phone),
          station:stations!reservations_station_id_fkey(name),
          fuel_type:fuel_types!reservations_fuel_type_id_fkey(name, code)
        `)
        .eq('id', reservationId)
        .single();

      if (reservationError || !reservation) {
        throw new Error('Reservation not found');
      }

      // 2. Get fuel inventory for this fuel type at the station
      const { data: inventory, error: inventoryError } = await supabase
        .from('station_fuel_inventory')
        .select('*')
        .eq('station_id', stationId)
        .eq('fuel_type_id', reservation.fuel_type_id)
        .single();

      if (inventoryError || !inventory) {
        throw new Error('Fuel inventory not found');
      }

      // 3. Check if there's enough fuel in stock
      if (inventory.current_stock < reservation.quantity) {
        return {
          success: false,
          message: `Insufficient fuel stock. Available: ${inventory.current_stock}L, Required: ${reservation.quantity}L`,
        };
      }

      // 4. Update reservation status to completed
      const { error: updateReservationError } = await supabase
        .from('reservations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          dispensed_by: operatorId,
        })
        .eq('id', reservationId);

      if (updateReservationError) throw updateReservationError;

      // 5. Decrease fuel stock in inventory
      const newStock = inventory.current_stock - reservation.quantity;
      const { error: updateInventoryError } = await supabase
        .from('station_fuel_inventory')
        .update({
          current_stock: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inventory.id);

      if (updateInventoryError) throw updateInventoryError;

      // 6. Record fuel dispensing log
      const { error: logError } = await supabase
        .from('fuel_dispensing_logs')
        .insert({
          station_id: stationId,
          fuel_type_id: reservation.fuel_type_id,
          quantity_dispensed: reservation.quantity,
          price_per_liter: reservation.price_per_liter,
          total_amount: reservation.total_price,
          reservation_id: reservationId,
          dispensed_by: operatorId,
          dispensed_at: new Date().toISOString(),
        });

      if (logError) {
        console.error('Failed to create dispensing log:', logError);
        // Don't throw - this is non-critical
      }

      // 7. Record fuel analytics
      await analyticsService.recordFuelAnalytics(
        stationId,
        reservation.fuel_type?.code || 'UNKNOWN',
        reservation.quantity,
        reservation.total_price,
        operatorId
      );

      // 8. Log system activity
      await analyticsService.logActivity(
        operatorId,
        'operator',
        'FUEL_DISPENSED',
        `Dispensed ${reservation.quantity}L of ${reservation.fuel_type?.name} to ${reservation.driver?.full_name}`,
        'fuel',
        {
          reservation_id: reservationId,
          fuel_type: reservation.fuel_type?.name,
          quantity: reservation.quantity,
          amount: reservation.total_price,
          driver_name: reservation.driver?.full_name,
          pickup_code: reservation.pickup_code,
        }
      );

      // 9. Create notification for driver
      await supabase
        .from('notifications')
        .insert({
          user_id: reservation.driver_id,
          type: 'reservation',
          title: 'Fuel Dispensed Successfully',
          message: `Your ${reservation.quantity}L of ${reservation.fuel_type?.name} has been dispensed at ${reservation.station?.name}. Thank you for using QuickFuel!`,
          related_id: reservationId,
        });

      return {
        success: true,
        message: `Successfully dispensed ${reservation.quantity}L of ${reservation.fuel_type?.name}`,
      };
    } catch (error: any) {
      logError('completeFuelDispensing', error);
      return {
        success: false,
        message: error.message || 'Failed to complete fuel dispensing',
      };
    }
  },
};