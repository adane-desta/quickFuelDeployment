// src/components/reservation/ReservationConfirmation.tsx
import { useEffect, useState } from 'react';
import { CheckCircle, MapPin, Calendar, Fuel, CreditCard, Smartphone, Download, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase/client';
import { Button } from '../ui/button';

interface ReservationConfirmationProps {
  reservationId: string | null;
  onViewReservations: () => void;
  onStartOver: () => void;
}

interface ReservationData {
  id: string;
  pickup_code: string;
  quantity: number;
  total_price: number;
  status: string;
  fuel_type: { name: string; price_per_liter: number };
  station: { name: string; address: string; latitude: number; longitude: number };
  time_slot: { start_time: string; end_time: string };
}

export function ReservationConfirmation({ reservationId, onViewReservations, onStartOver }: ReservationConfirmationProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<ReservationData | null>(null);

  useEffect(() => {
    if (!reservationId) {
      setError('No reservation ID provided');
      setLoading(false);
      return;
    }

    const fetchReservation = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('reservations')
          .select(`
            id,
            pickup_code,
            quantity,
            total_price,
            status,
            fuel_type:fuel_types(name, price_per_liter),
            station:stations(name, address, latitude, longitude),
            time_slot:time_slots(start_time, end_time)
          `)
          .eq('id', reservationId)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Reservation not found');

        setReservation(data as ReservationData);
      } catch (err: any) {
        console.error('Failed to load reservation:', err);
        setError(err.message || 'Could not load reservation details');
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();

    // Optional: subscribe to realtime updates for status changes
    const subscription = supabase
      .channel(`reservation-${reservationId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'reservations',
        filter: `id=eq.${reservationId}`,
      }, (payload) => {
        if (payload.new.status === 'completed') {
          // Optionally show a toast or update UI
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [reservationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your confirmation...</p>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-3">⚠️</div>
        <p className="text-gray-800 mb-4">{error || 'Failed to load reservation'}</p>
        <Button onClick={onStartOver} variant="outline">Start Over</Button>
      </div>
    );
  }

  const pickupCode = reservation.pickup_code;
  const numericCode = pickupCode?.replace(/\D/g, '').slice(0, 6) || '000000';
  const pricePerLiter = reservation.fuel_type?.price_per_liter || 0;
  const totalCost = reservation.total_price || reservation.quantity * pricePerLiter;
  const startTime = reservation.time_slot?.start_time ? new Date(reservation.time_slot.start_time).toLocaleTimeString() : 'N/A';
  const endTime = reservation.time_slot?.end_time ? new Date(reservation.time_slot.end_time).toLocaleTimeString() : 'N/A';
  const stationName = reservation.station?.name || 'Unknown station';
  const address = reservation.station?.address || '';

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h3 className="text-gray-900 mb-2">Reservation Confirmed!</h3>
        <p className="text-gray-600">Your fuel has been reserved successfully</p>
      </div>

      {/* QR & Pickup Code */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
        <div className="bg-white rounded-lg p-4 w-fit mx-auto mb-4">
          <QRCodeSVG value={pickupCode || numericCode} size={160} />
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Pickup Code</p>
          <p className="text-2xl text-gray-900 tracking-wider mb-1 font-mono">{numericCode}</p>
          <p className="text-xs text-gray-500">Show this at the fuel station</p>
        </div>
      </div>

      {/* Reservation Details */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h4 className="text-gray-900">Reservation Details</h4>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Station</p>
              <p className="text-gray-900">{stationName}</p>
              <p className="text-sm text-gray-600">{address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Time Slot</p>
              <p className="text-gray-900">{startTime} – {endTime}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Fuel className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Fuel Details</p>
              <p className="text-gray-900">{reservation.fuel_type?.name} – {reservation.quantity} Liters</p>
              <p className="text-sm text-gray-600">ETB {pricePerLiter}/L × {reservation.quantity}L = ETB {totalCost}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Payment Method</p>
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-orange-600" />
                <p className="text-gray-900">Telebirr / Chapa (Mock)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {/* Implement download as PDF or image */}}
          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </button>
        <button
          onClick={() => {/* Implement share via Web Share API */}}
          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-900 mb-2">Important Reminders:</p>
        <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
          <li>Please arrive within your selected time slot</li>
          <li>Show your pickup code to the station attendant</li>
          <li>Payment will be processed at the station</li>
          <li>Reservation valid for selected date only</li>
        </ul>
      </div>

      {/* Done Button */}
      <div className="flex gap-3">
        <Button onClick={onStartOver} variant="outline" className="flex-1">
          New Reservation
        </Button>
        <Button onClick={onViewReservations} className="flex-1 bg-blue-600 hover:bg-blue-700">
          View My Reservations
        </Button>
      </div>
    </div>
  );
}