// =====================================================
// RESERVATION CONFIRMATION - SUCCESS SCREEN
// =====================================================

import React, { useState, useEffect } from 'react';

import {
  CheckCircle,
  Copy,
  Download,
  Navigation,
  Calendar,
  Clock,
  Fuel,
  MapPin,
  DollarSign,
} from 'lucide-react';

import { supabase } from '../../lib/supabase/client';

import {
  notifySuccess,
  notifyError,
} from '../../lib/utils/notifications';

import type { Reservation } from '../../types/advanced';

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

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

    const fetchReservation = async () => {

      console.log(
        'Fetching reservation:',
        reservationId
      );

      if (!reservationId) {

        console.error(
          'No reservationId provided'
        );

        setLoading(false);

        return;
      }

      try {

        setLoading(true);

        /*
          =====================================
          SIMPLE QUERY ONLY
          =====================================
        */

        const {
          data: reservationData,
          error: reservationError,
        } = await supabase
          .from('reservations')
          .select('*')
          .eq('id', reservationId)
          .single();

        if (reservationError) {

          console.error(
            'Reservation fetch error:',
            reservationError
          );

          notifyError(
            'Failed to load reservation',
            reservationError
          );

          setLoading(false);

          return;
        }

        console.log(
          'Reservation data:',
          reservationData
        );

        /*
          =====================================
          FETCH STATION
          =====================================
        */

        let stationData = null;

        if (reservationData?.station_id) {

          const {
            data,
          } = await supabase
            .from('stations')
            .select(`
              name,
              address,
              phone,
              latitude,
              longitude
            `)
            .eq(
              'id',
              reservationData.station_id
            )
            .single();

          stationData = data;
        }

        /*
          =====================================
          FETCH FUEL TYPE
          =====================================
        */

        let fuelTypeData = null;

        if (reservationData?.fuel_type_id) {

          const {
            data,
          } = await supabase
            .from('fuel_types')
            .select(`
              name,
              code
            `)
            .eq(
              'id',
              reservationData.fuel_type_id
            )
            .single();

          fuelTypeData = data;
        }

        /*
          =====================================
          FETCH TIME SLOT
          =====================================
        */

        let timeSlotData = null;

        if (reservationData?.time_slot_id) {

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
            .single();

          timeSlotData = data;
        }

        /*
          =====================================
          BUILD FINAL OBJECT
          =====================================
        */

        const finalReservation = {
          ...reservationData,

          station_name:
            stationData?.name || 'Unknown Station',

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

        setReservation(finalReservation);

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

        setLoading(false);
      }
    };

    fetchReservation();

  }, [reservationId]);

  /*
    =========================================
    COPY PICKUP CODE
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
    DOWNLOAD RECEIPT
    =========================================
  */
  const handleDownloadReceipt = () => {

    notifySuccess(
      'Receipt download started'
    );
  };

  /*
    =========================================
    LOADING
    =========================================
  */
  if (loading && !reservation) {

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
  if (!loading && !reservation) {

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
              {reservation?.pickup_code || '------'}
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
              {reservation?.station_name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Fuel Type
            </p>

            <p className="font-medium">
              {reservation?.fuel_type_name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Quantity
            </p>

            <p className="font-medium">
              {reservation?.quantity} Liters
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Amount Paid
            </p>

            <p className="font-medium text-green-600">
              ETB {reservation?.total_price}
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