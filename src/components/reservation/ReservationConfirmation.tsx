// =====================================================
// RESERVATION CONFIRMATION - SUCCESS SCREEN
// =====================================================

import React, { useState, useEffect, useCallback } from 'react';

import {
  CheckCircle,
  Copy,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../contexts/AuthContext';

import {
  notifySuccess,
  notifyError,
} from '../../lib/utils/notifications';

import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface ReservationConfirmationProps {
  reservationId: string;
  onViewReservations: () => void;
  onStartOver: () => void;
}

export function ReservationConfirmation({
  reservationId,
  onViewReservations,
  onStartOver,
}: ReservationConfirmationProps) {

  const { loading: authLoading } = useAuth();

  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH RESERVATION  
  // Waits for AuthContext to finish loading before querying so that the
  // Supabase JWT is attached and RLS policies allow the read.
  // ─────────────────────────────────────────────────────────────────────────
  const fetchReservation = useCallback(async () => {
    if (!reservationId) {
      setError('No reservation ID provided.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ── Reservation ────────────────────────────────────────────────────
      const { data: reservationData, error: reservationError } =
        await supabase
          .from('reservations')
          .select('*')
          .eq('id', reservationId)
          .maybeSingle();

      if (reservationError) throw reservationError;

      if (!reservationData) {
        // Could be a brief RLS propagation delay — surface a retryable error
        throw new Error('Reservation record not found. It may still be processing.');
      }

      // ── Station ────────────────────────────────────────────────────────
      let stationData = null;
      if (reservationData.station_id) {
        const { data } = await supabase
          .from('stations')
          .select('name, address')
          .eq('id', reservationData.station_id)
          .maybeSingle();
        stationData = data;
      }

      // ── Fuel Type ──────────────────────────────────────────────────────
      let fuelTypeData = null;
      if (reservationData.fuel_type_id) {
        const { data } = await supabase
          .from('fuel_types')
          .select('name')
          .eq('id', reservationData.fuel_type_id)
          .maybeSingle();
        fuelTypeData = data;
      }

      // ── Time Slot ──────────────────────────────────────────────────────
      let timeSlotData = null;
      if (reservationData.time_slot_id) {
        const { data } = await supabase
          .from('time_slots')
          .select('slot_date, start_time, end_time')
          .eq('id', reservationData.time_slot_id)
          .maybeSingle();
        timeSlotData = data;
      }

      setReservation({
        ...reservationData,
        station_name:    stationData?.name    || 'Unknown Station',
        station_address: stationData?.address || '',
        fuel_type_name:  fuelTypeData?.name   || 'Fuel',
        slot_date:       timeSlotData?.slot_date,
        slot_start_time: timeSlotData?.start_time,
        slot_end_time:   timeSlotData?.end_time,
      });

    } catch (err: any) {
      console.error('[ReservationConfirmation] fetch error:', err);
      setError(err.message || 'Failed to load reservation details.');
    } finally {
      setLoading(false);
    }
  }, [reservationId, retryCount]); // retryCount forces a re-run when user hits Retry

  // Wait for auth to be ready, THEN fetch.
  // On a fresh page load after Chapa redirect, authLoading starts true and
  // becomes false once the session cookie is restored. We must not query
  // before that or the request runs as anonymous and RLS blocks it.
  useEffect(() => {
    if (authLoading) {
      // Auth is still initializing — keep showing the loading state
      // but don't start the DB query yet.
      return;
    }
    fetchReservation();
  }, [authLoading, fetchReservation]);

  // ─────────────────────────────────────────────────────────────────────────
  // COPY PICKUP CODE
  // ─────────────────────────────────────────────────────────────────────────
  const handleCopyPickupCode = () => {
    if (!reservation?.pickup_code) return;
    navigator.clipboard.writeText(reservation.pickup_code);
    notifySuccess('Pickup code copied!');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            {authLoading ? 'Restoring your session…' : 'Loading your reservation…'}
          </p>
          <p className="text-sm text-gray-400 mt-1">Please wait a moment</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ERROR STATE  (with retry button)
  // ─────────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="size-12 text-yellow-500" />
        <p className="text-center text-gray-700 font-medium px-4">{error}</p>
        <div className="flex flex-col gap-2 w-full">
          <Button
            onClick={() => setRetryCount(c => c + 1)}
            className="w-full"
          >
            <RefreshCw className="size-4 mr-2" />
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={onViewReservations}
            className="w-full"
          >
            View My Reservations
          </Button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NOT FOUND STATE
  // ─────────────────────────────────────────────────────────────────────────
  if (!reservation) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="size-12 text-red-500" />
        <p className="text-red-600 font-medium text-center">
          Reservation not found.
        </p>
        <Button onClick={onViewReservations} className="w-full">
          View My Reservations
        </Button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS STATE
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* SUCCESS BANNER */}
      <Card className="p-6 text-center border-2 border-green-500 bg-green-50">
        <div className="inline-flex items-center justify-center size-16 bg-green-500 rounded-full mb-4">
          <CheckCircle className="size-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-green-900 mb-2">
          Reservation Confirmed!
        </h2>
        <p className="text-green-700">
          Your fuel has been reserved. Show the code below at the station.
        </p>
      </Card>

      {/* PICKUP CODE */}
      <Card className="p-6 border-2 border-primary">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Your Pickup Code</p>
          <div className="inline-block p-6 bg-white rounded-2xl shadow-lg mb-4">
            <p className="text-5xl font-bold font-mono tracking-wider text-primary">
              {reservation.pickup_code}
            </p>
          </div>
          <div>
            <Button variant="outline" onClick={handleCopyPickupCode}>
              <Copy className="size-4 mr-2" />
              Copy Code
            </Button>
          </div>
        </div>
      </Card>

      {/* RESERVATION DETAILS */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Reservation Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <p className="text-sm text-gray-500">Station</p>
            <p className="font-medium text-right">{reservation.station_name}</p>
          </div>
          {reservation.slot_date && (
            <div className="flex justify-between">
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">
                {new Date(reservation.slot_date).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                })}
              </p>
            </div>
          )}
          {reservation.slot_start_time && (
            <div className="flex justify-between">
              <p className="text-sm text-gray-500">Time Slot</p>
              <p className="font-medium">
                {reservation.slot_start_time} – {reservation.slot_end_time}
              </p>
            </div>
          )}
          <div className="flex justify-between">
            <p className="text-sm text-gray-500">Fuel Type</p>
            <p className="font-medium">{reservation.fuel_type_name}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-gray-500">Quantity</p>
            <p className="font-medium">{reservation.quantity} Liters</p>
          </div>
          <div className="flex justify-between border-t pt-3 mt-3">
            <p className="text-sm text-gray-500">Amount Paid</p>
            <p className="font-semibold text-green-600 text-lg">
              ETB {Number(reservation.total_price).toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* REMINDER */}
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <p className="text-sm font-medium text-yellow-900 mb-2">Important Reminders</p>
        <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
          <li>Arrive within your selected time slot</li>
          <li>Show your 6-digit pickup code to the operator</li>
          <li>Your reservation expires 15 minutes after the slot ends</li>
        </ul>
      </Card>

      {/* ACTIONS */}
      <div className="flex flex-col gap-3 pb-4">
        <Button onClick={onViewReservations} size="lg" className="w-full">
          View My Reservations
        </Button>
        <Button
          onClick={onStartOver}
          variant="outline"
          size="lg"
          className="w-full"
        >
          Make Another Reservation
        </Button>
      </div>

    </div>
  );
}
