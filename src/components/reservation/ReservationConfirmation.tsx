// =====================================================
// RESERVATION CONFIRMATION - SUCCESS SCREEN
// =====================================================
// Shows pickup code, QR code, and reservation details
// =====================================================

import React, { useState, useEffect } from 'react';
import { CheckCircle, Copy, Download, Navigation, Calendar, Clock, Fuel, MapPin, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { notifySuccess, notifyError } from '../../lib/utils/notifications';
import type { Reservation } from '../../types/advanced';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
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
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservation();
  }, [reservationId]);

  const loadReservation = async () => {
    setLoading(true);
    try {
      // Get reservation details from database
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          station:stations(name, address, phone, latitude, longitude),
          fuel_type:fuel_types(name, code),
          time_slot:time_slots(slot_date, start_time, end_time)
        `)
        .eq('id', reservationId)
        .single();

      if (error) throw error;

      setReservation({
        ...data,
        station_name: data.station?.name,
        fuel_type_name: data.fuel_type?.name,
        slot_date: data.time_slot?.slot_date,
        slot_start_time: data.time_slot?.start_time,
        slot_end_time: data.time_slot?.end_time,
      } as Reservation);
    } catch (error) {
      notifyError('Failed to load reservation', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPickupCode = () => {
    if (reservation) {
      navigator.clipboard.writeText(reservation?.pickup_code);
      notifySuccess('Pickup code copied to clipboard!');
    }
  };

  console.log('ReservationConfirmation render ✅✅✅✅✅✅✅✅✅✅✅✅', {
    loading,
    reservation,
  });

  const handleDownloadReceipt = () => {
    notifySuccess('Receipt download started');
    // In production, generate PDF receipt
  };

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
      {/* Success Message */}
      <Card className="p-6 text-center border-2 border-green-500 bg-green-50">
        <div className="inline-flex items-center justify-center size-16 bg-green-500 rounded-full mb-4">
          <CheckCircle className="size-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-green-900 mb-2">
          Reservation Confirmed!
        </h2>
        <p className="text-green-700">
          Your fuel has been reserved. Show the pickup code below at the station.
        </p>
      </Card>

      {/* Pickup Code */}
      <Card className="p-6 border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 mb-2">Your Pickup Code</p>
          <div className="inline-block p-6 bg-white rounded-2xl shadow-lg mb-4">
            <p className="text-5xl font-bold font-mono tracking-wider text-primary">
              {reservation?.pickup_code}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Show this 6-digit code at the station
          </p>
        </div>

        {/* QR Code Placeholder */}
        <div className="flex justify-center mb-4">
          <div className="size-48 bg-white border-4 border-primary rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <div className="size-32 bg-gray-200 rounded-xl mb-2" />
              <p className="text-xs text-gray-500">QR Code</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCopyPickupCode}
          >
            <Copy className="size-4 mr-2" />
            Copy Code
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDownloadReceipt}
          >
            <Download className="size-4 mr-2" />
            Download
          </Button>
        </div>
      </Card>

      {/* Reservation Details */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Reservation Details</h3>
        
        <div className="space-y-4">
          {/* Station */}
          <div className="flex items-start gap-3 pb-3 border-b">
            <MapPin className="size-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Station</p>
              <p className="font-medium text-lg">{reservation?.station_name}</p>
              <Button
                variant="link"
                className="p-0 h-auto text-sm text-primary"
                onClick={() => notifySuccess('Opening navigation...')}
              >
                <Navigation className="size-3 mr-1" />
                Get Directions
              </Button>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-start gap-3 pb-3 border-b">
            <Calendar className="size-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Reservation Time</p>
              <p className="font-medium">
                {reservation?.slot_date && new Date(reservation?.slot_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="size-4 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {reservation?.slot_start_time} - {reservation?.slot_end_time}
                </p>
              </div>
            </div>
          </div>

          {/* Fuel Details */}
          <div className="flex items-start gap-3 pb-3 border-b">
            <Fuel className="size-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Fuel Details</p>
              <p className="font-medium">{reservation?.fuel_type_name}</p>
              <p className="text-sm text-gray-600">{reservation?.quantity} Liters</p>
            </div>
          </div>

          {/* Payment */}
          <div className="flex items-start gap-3">
            <DollarSign className="size-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Total Amount Paid</p>
              <p className="font-semibold text-2xl text-green-600">
                ETB {reservation?.total_price.toFixed(2)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-green-600">Paid</Badge>
                <span className="text-xs text-gray-500">
                  {reservation?.payment_method}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Important Instructions */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Important Instructions:</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>Arrive within your reserved time slot</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>Show your pickup code ({reservation?.pickup_code}) to the operator</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>Your reservation will expire 15 minutes after the slot ends</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>Have your vehicle ready for fueling</span>
          </li>
        </ul>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button onClick={onViewReservations} size="lg" className="w-full">
          View All Reservations
        </Button>
        <Button onClick={onStartOver} variant="outline" size="lg" className="w-full">
          Make Another Reservation
        </Button>
      </div>

      {/* Expiration Warning */}
      {reservation?.expires_at && (
        <p className="text-center text-sm text-gray-500">
          This reservation expires at{' '}
          {new Date(reservation?.expires_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  );
}