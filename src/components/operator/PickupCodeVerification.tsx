// =====================================================
// PICKUP CODE VERIFICATION - OPERATOR COMPONENT
// =====================================================
// Verify 6-digit codes and dispense fuel
// Production-ready with real-time validation
// =====================================================

import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, AlertTriangle, Fuel, User, Phone, Car, Calendar, Clock } from 'lucide-react';
import { reservationService } from '../../lib/supabase/database-advanced';
import { notifications, notifyError } from '../../lib/utils/notifications';
import { useAuth } from '../../contexts/AuthContext';
import type { Reservation } from '../../types/advanced';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface PickupCodeVerificationProps {
  stationId: string;
  onVerified?: () => void;
}

export function PickupCodeVerification({ stationId, onVerified }: PickupCodeVerificationProps) {
  const { user } = useAuth();
  const [pickupCode, setPickupCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [dispensing, setDispensing] = useState(false);

  const handleVerify = async () => {
    if (pickupCode.length !== 6) {
      notifyError('Please enter a valid 6-digit code');
      return;
    }

    setVerifying(true);
    try {
      const res = await reservationService.verifyPickupCode(pickupCode, stationId);
      if (res) {
        setReservation(res);
        notifications.reservation.verified();
        
        // Auto-mark as arrived if status is confirmed
        if (res.status === 'confirmed' && user) {
          await reservationService.updateReservationStatus(res.id, 'arrived', user.id);
          setReservation({ ...res, status: 'arrived' });
        }
      }
    } catch (error) {
      setReservation(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleStartDispensing = async () => {
    if (!reservation || !user) return;

    setDispensing(true);
    try {
      const success = await reservationService.updateReservationStatus(
        reservation.id,
        'dispensing',
        user.id
      );

      if (success) {
        setReservation({ ...reservation, status: 'dispensing' });
        notifications.reservation.verified();
      }
    } catch (error) {
      notifyError('Failed to start dispensing', error);
    } finally {
      setDispensing(false);
    }
  };

  const handleCompleteDispensing = async () => {
    if (!reservation || !user) return;

    setDispensing(true);
    try {
      const success = await reservationService.updateReservationStatus(
        reservation.id,
        'completed',
        user.id
      );

      if (success) {
        notifications.reservation.completed();
        
        // Reset form
        setPickupCode('');
        setReservation(null);
        
        // Callback
        if (onVerified) onVerified();
      }
    } catch (error) {
      notifyError('Failed to complete dispensing', error);
    } finally {
      setDispensing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pickupCode.length === 6) {
      handleVerify();
    }
  };

  const resetForm = () => {
    setPickupCode('');
    setReservation(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Verify Pickup Code</h2>
        <p className="text-gray-600">Enter the 6-digit code provided by the driver</p>
      </div>

      {/* Code Input */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Pickup Code</label>
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="000000"
                value={pickupCode}
                onChange={(e) => setPickupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyPress={handleKeyPress}
                maxLength={6}
                className="text-2xl text-center tracking-widest font-mono"
                disabled={verifying || reservation !== null}
              />
              {reservation ? (
                <Button onClick={resetForm} variant="outline" className="min-w-[100px]">
                  Clear
                </Button>
              ) : (
                <Button onClick={handleVerify} disabled={pickupCode.length !== 6 || verifying} className="min-w-[100px]">
                  {verifying ? (
                    <>
                      <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Verifying
                    </>
                  ) : (
                    <>
                      <Search className="size-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Enter all 6 digits without spaces or dashes
            </p>
          </div>
        </div>
      </Card>

      {/* Verification Result */}
      {reservation && (
        <Card className="p-6 border-2 border-green-500 bg-green-50/50">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-6 text-green-600" />
              <span className="text-lg font-semibold text-green-900">Valid Reservation</span>
            </div>
            <Badge className="bg-green-600 text-white">
              {reservation.status === 'confirmed' && 'Confirmed'}
              {reservation.status === 'arrived' && 'Arrived'}
              {reservation.status === 'dispensing' && 'Dispensing'}
            </Badge>
          </div>

          <Separator className="my-4" />

          {/* Driver Information */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Driver Information</p>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <User className="size-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{reservation.driver_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="size-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{reservation.driver_phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Car className="size-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Plate Number</p>
                    <p className="font-medium">{reservation.driver_plate || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Fuel Details */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Fuel Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <Fuel className="size-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Fuel Type</p>
                    <p className="font-medium">{reservation.fuel_type_name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Quantity</p>
                  <p className="font-medium">{reservation.quantity} Liters</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price/Liter</p>
                  <p className="font-medium">ETB {reservation.price_per_liter.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-medium text-lg text-green-600">
                    ETB {reservation.total_price.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Time Slot */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Reserved Time Slot</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">
                      {new Date(reservation.slot_date!).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="size-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">{reservation.slot_start_time} - {reservation.slot_end_time}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-sm text-gray-600">Payment Status</span>
              <Badge className="bg-green-600 text-white">
                {reservation.payment_status === 'paid' ? 'Paid' : reservation.payment_status}
              </Badge>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Action Buttons */}
          <div className="space-y-3">
            {reservation.status === 'arrived' && (
              <Button
                onClick={handleStartDispensing}
                disabled={dispensing}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {dispensing ? 'Processing...' : 'Start Fuel Dispensing'}
              </Button>
            )}

            {reservation.status === 'dispensing' && (
              <Button
                onClick={handleCompleteDispensing}
                disabled={dispensing}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {dispensing ? (
                  <>
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="size-5 mr-2" />
                    Complete Dispensing
                  </>
                )}
              </Button>
            )}

            <p className="text-xs text-center text-gray-500">
              {reservation.status === 'arrived' && 'Click to begin fuel dispensing process'}
              {reservation.status === 'dispensing' && 'Click after fuel has been fully dispensed'}
            </p>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <AlertTriangle className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900 space-y-1">
            <p className="font-medium">Instructions:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Ask the driver for their 6-digit pickup code</li>
              <li>Enter the code and click Verify</li>
              <li>Confirm driver details match</li>
              <li>Start dispensing when ready</li>
              <li>Mark as complete after fuel is dispensed</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
