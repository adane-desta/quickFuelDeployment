// =====================================================
// RESERVATION CONFIRMATION - SUCCESS SCREEN
// =====================================================

import React, { useState, useEffect } from 'react';

import {
  CheckCircle,
  Copy,
} from 'lucide-react';

import { supabase } from '../../lib/supabase/client';

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

  const [reservation, setReservation] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  /*
    =========================================
    LOAD RESERVATION
    =========================================
  */
  useEffect(() => {

    let mounted = true;

    const fetchReservation = async () => {

      console.log(
        'Fetching reservation:',
        reservationId
      );

      if (!reservationId) {

        console.error(
          'No reservationId'
        );

        if (mounted) {
          setLoading(false);
        }

        return;
      }

      try {

        if (mounted) {
          setLoading(true);
        }

        /*
          =====================================
          GET RESERVATION
          =====================================
        */

        const {
          data: reservationData,
          error: reservationError,
        } = await supabase
          .from('reservations')
          .select('*')
          .eq('id', reservationId)
          .maybeSingle();

        console.log(
          'Reservation query result:',
          reservationData,
          reservationError
        );

        if (reservationError) {
          throw reservationError;
        }

        if (!reservationData) {

          console.error(
            'Reservation not found'
          );

          if (mounted) {
            setReservation(null);
          }

          return;
        }

        /*
          =====================================
          GET STATION
          =====================================
        */

        let stationData = null;

        if (reservationData.station_id) {

          const {
            data,
          } = await supabase
            .from('stations')
            .select(`
              name,
              address
            `)
            .eq(
              'id',
              reservationData.station_id
            )
            .maybeSingle();

          stationData = data;
        }

        /*
          =====================================
          GET FUEL TYPE
          =====================================
        */

        let fuelTypeData = null;

        if (reservationData.fuel_type_id) {

          const {
            data,
          } = await supabase
            .from('fuel_types')
            .select(`
              name
            `)
            .eq(
              'id',
              reservationData.fuel_type_id
            )
            .maybeSingle();

          fuelTypeData = data;
        }

        /*
          =====================================
          GET TIME SLOT
          =====================================
        */

        let timeSlotData = null;

        if (reservationData.time_slot_id) {

          const {
            data,
          } = await supabase
            .from('time_slots')
            .select(`
              slot_date,
              start_time,
              end_time
            `)
            .eq(
              'id',
              reservationData.time_slot_id
            )
            .maybeSingle();

          timeSlotData = data;
        }

        /*
          =====================================
          FINAL OBJECT
          =====================================
        */

        const finalReservation = {

          ...reservationData,

          station_name:
            stationData?.name ||
            'Unknown Station',

          station_address:
            stationData?.address || '',

          fuel_type_name:
            fuelTypeData?.name || 'Fuel',

          slot_date:
            timeSlotData?.slot_date,

          slot_start_time:
            timeSlotData?.start_time,

          slot_end_time:
            timeSlotData?.end_time,
        };

        console.log(
          'Final reservation:',
          finalReservation
        );

        if (mounted) {
          setReservation(finalReservation);
        }

      } catch (error) {

        console.error(
          'Reservation fetch failed:',
          error
        );

        notifyError(
          'Failed to load reservation',
          error
        );

      } finally {

        console.log(
          'Reservation loading finished'
        );

        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchReservation();

    return () => {

      console.log(
        'ReservationConfirmation unmounted'
      );

      mounted = false;
    };

  }, [reservationId]);

  /*
    =========================================
    COPY CODE
    =========================================
  */
  const handleCopyPickupCode = () => {

    if (!reservation?.pickup_code) {
      return;
    }

    navigator.clipboard.writeText(
      reservation.pickup_code
    );

    notifySuccess(
      'Pickup code copied!'
    );
  };

  /*
    =========================================
    LOADING
    =========================================
  */
  if (loading) {

    return (
      <div className="flex items-center justify-center py-12">

        <div className="text-center">

          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />

          <p className="text-gray-600">
            Loading reservation...
          </p>

        </div>
      </div>
    );
  }

  /*
    =========================================
    NOT FOUND
    =========================================
  */
  if (!reservation) {

    return (
      <div className="text-center py-12">

        <p className="text-red-600 font-medium">
          Reservation not found
        </p>

      </div>
    );
  }

  return (

    <div className="space-y-6">

      {/* SUCCESS */}
      <Card className="p-6 text-center border-2 border-green-500 bg-green-50">

        <div className="inline-flex items-center justify-center size-16 bg-green-500 rounded-full mb-4">

          <CheckCircle className="size-8 text-white" />

        </div>

        <h2 className="text-2xl font-bold text-green-900 mb-2">
          Reservation Confirmed!
        </h2>

        <p className="text-green-700">
          Your fuel has been reserved.
        </p>

      </Card>

      {/* PICKUP CODE */}
      <Card className="p-6 border-2 border-primary">

        <div className="text-center">

          <p className="text-sm text-gray-600 mb-2">
            Pickup Code
          </p>

          <div className="inline-block p-6 bg-white rounded-2xl shadow-lg mb-4">

            <p className="text-5xl font-bold font-mono tracking-wider text-primary">
              {reservation.pickup_code}
            </p>

          </div>

          <Button
            variant="outline"
            onClick={handleCopyPickupCode}
          >
            <Copy className="size-4 mr-2" />
            Copy Code
          </Button>

        </div>

      </Card>

      {/* DETAILS */}
      <Card className="p-6">

        <h3 className="font-semibold text-lg mb-4">
          Reservation Details
        </h3>

        <div className="space-y-4">

          <div>
            <p className="text-sm text-gray-500">
              Station
            </p>

            <p className="font-medium">
              {reservation.station_name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Fuel Type
            </p>

            <p className="font-medium">
              {reservation.fuel_type_name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Quantity
            </p>

            <p className="font-medium">
              {reservation.quantity} Liters
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Amount Paid
            </p>

            <p className="font-medium text-green-600">
              ETB {reservation.total_price}
            </p>
          </div>

        </div>

      </Card>

      {/* ACTIONS */}
      <div className="flex flex-col gap-3">

        <Button
          onClick={onViewReservations}
          size="lg"
          className="w-full"
        >
          View Reservations
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