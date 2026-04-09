// =====================================================
// PICKUP VERIFICATION - FULLY DATABASE INTEGRATED
// =====================================================
// Complete pickup code verification with all side effects:
// - Real-time database verification
// - Fuel stock deduction
// - Analytics recording
// - Activity logging
// - Notifications
// =====================================================

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reservationService, fuelDispensingService } from '../../lib/supabase/database-advanced';
import { stationService } from '../../lib/supabase/database';
import { notifySuccess, notifyError, notifyWarning } from '../../lib/utils/notifications';
import type { Reservation } from '../../types/advanced';
import {
  QrCode,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Car,
  Fuel,
  Calendar,
  Clock,
  AlertTriangle,
  DollarSign,
  Droplets,
  MapPin,
  Phone,
  CreditCard,
  Package,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

type VerificationState = 'idle' | 'verifying' | 'verified' | 'invalid' | 'expired' | 'completed' | 'dispensing';

export function PickupVerification() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [state, setState] = useState<VerificationState>('idle');
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [stationId, setStationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Load station on mount
  useEffect(() => {
    const loadStation = async () => {
      if (user) {
        const station = await stationService.getOperatorStation(user.id);
        if (station) {
          setStationId(station.id);
        }
      }
    };
    loadStation();
  }, [user]);

  // Scroll to result when state changes
  useEffect(() => {
    if (state !== 'idle' && state !== 'verifying' && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [state]);

  const handleVerify = async () => {
    if (!code.trim() || code.length !== 6) {
      notifyWarning('Please enter a valid 6-digit pickup code');
      return;
    }

    if (!stationId) {
      notifyError('Station not found', new Error('No station assigned'));
      return;
    }

    setState('verifying');
    setLoading(true);

    try {
      // Verify pickup code against database
      const foundReservation = await reservationService.verifyPickupCode(code, stationId);

      if (!foundReservation) {
        setState('invalid');
        setReservation(null);
      } else if (foundReservation.status === 'completed') {
        setState('completed');
        setReservation(foundReservation);
      } else if (foundReservation.status === 'cancelled') {
        setState('invalid');
        setReservation(null);
        notifyError('This reservation has been cancelled', new Error('Cancelled reservation'));
      } else if (new Date(foundReservation.expires_at) < new Date()) {
        setState('expired');
        setReservation(foundReservation);
      } else {
        setState('verified');
        setReservation(foundReservation);
        notifySuccess('Pickup code verified successfully!');
      }
    } catch (error) {
      setState('invalid');
      setReservation(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async () => {
    if (!reservation || !user || !stationId) return;

    setState('dispensing');
    setLoading(true);

    try {
      // First update status to dispensing
      await reservationService.updateReservationStatus(
        reservation.id,
        'dispensing',
        user.id
      );

      // Complete the fuel dispensing process with all side effects
      const result = await fuelDispensingService.completeFuelDispensing(
        reservation.id,
        user.id,
        stationId
      );

      if (result.success) {
        setState('idle');
        notifySuccess(result.message);
        
        // Show success state briefly then reset
        setTimeout(() => {
          resetVerification();
        }, 3000);
      } else {
        notifyError('Dispensing failed', new Error(result.message));
        setState('verified');
      }
    } catch (error) {
      notifyError('Failed to dispense fuel', error);
      setState('verified');
    } finally {
      setLoading(false);
    }
  };

  const resetVerification = () => {
    setCode('');
    setState('idle');
    setReservation(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ET', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-4 shadow-lg">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Pickup Verification</h1>
          <p className="text-gray-600">
            Scan or enter the driver's 6-digit pickup code
          </p>
        </div>

        {/* Code Input Card */}
        <Card className="mb-6 overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
            <div className="flex items-center justify-center gap-3 mb-3">
              <QrCode className="w-8 h-8" />
              <h3 className="text-xl font-semibold">Enter Pickup Code</h3>
            </div>
            <p className="text-green-100 text-sm text-center">
              6-digit code provided by the driver
            </p>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <Input
                type="text"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                  setCode(value);
                  if (state !== 'idle' && state !== 'verifying') {
                    setState('idle');
                  }
                }}
                placeholder="000000"
                maxLength={6}
                className="text-center text-3xl tracking-[0.5em] font-mono h-16 border-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && code.length === 6) {
                    handleVerify();
                  }
                }}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 text-center mt-2">
                Press Enter after typing the code
              </p>
            </div>

            <Button
              onClick={handleVerify}
              disabled={code.length !== 6 || loading}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {state === 'verifying' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Verify Code
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Verification Success - Show Reservation Details */}
        {state === 'verified' && reservation && (
          <Card className="mb-6 border-2 border-green-300 shadow-lg" ref={resultRef}>
            <div className="bg-green-50 p-4 border-b border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900 text-lg">
                    Valid Reservation Found
                  </h3>
                  <p className="text-sm text-green-700">
                    Code verified • Ready to dispense fuel
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Driver & Vehicle Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Driver Name</p>
                    <p className="font-semibold text-gray-900">{reservation.driver_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                    <p className="font-semibold text-gray-900">{reservation.driver_phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Car className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Plate Number</p>
                    <p className="font-semibold text-gray-900">
                      {reservation.driver_plate || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Reservation Date</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(reservation.slot_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Time Slot</p>
                    <p className="font-semibold text-gray-900">
                      {reservation.slot_start_time} - {reservation.slot_end_time}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                    <p className="font-semibold text-gray-900">
                      {reservation.payment_method}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Fuel Details */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Fuel className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-xs text-blue-600 mb-1">Fuel Type</p>
                    <p className="font-bold text-lg text-blue-900">
                      {reservation.fuel_type_name}
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Droplets className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-xs text-blue-600 mb-1">Quantity</p>
                    <p className="font-bold text-lg text-blue-900">
                      {reservation.quantity} Liters
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-xs text-green-600 mb-1">Total Amount</p>
                    <p className="font-bold text-lg text-green-900">
                      ETB {reservation.total_amount?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Payment Confirmed</p>
                    <p className="text-sm text-green-700">
                      Status: {reservation.payment_status?.toUpperCase()}
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-600">PAID</Badge>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleDispense}
                  disabled={loading}
                  className="flex-1 h-14 text-lg bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {loading && state === 'dispensing' ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Dispensing Fuel...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Authorize & Dispense Fuel
                    </>
                  )}
                </Button>

                <Button
                  onClick={resetVerification}
                  disabled={loading}
                  variant="outline"
                  className="px-6 h-14"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Invalid Code */}
        {state === 'invalid' && (
          <Card className="mb-6 border-2 border-red-300 shadow-lg" ref={resultRef}>
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Invalid Pickup Code
              </h3>
              <p className="text-gray-600 mb-6">
                No valid reservation found for code <span className="font-mono font-bold">{code}</span> at your station.
                <br />
                Please verify the code and try again.
              </p>
              <Button
                onClick={resetVerification}
                variant="destructive"
                size="lg"
              >
                Try Again
              </Button>
            </div>
          </Card>
        )}

        {/* Expired Code */}
        {state === 'expired' && reservation && (
          <Card className="mb-6 border-2 border-yellow-300 shadow-lg" ref={resultRef}>
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-12 h-12 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Reservation Expired
              </h3>
              <p className="text-gray-600 mb-2">
                This reservation has expired and can no longer be used.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Expired at: {new Date(reservation.expires_at).toLocaleString()}
              </p>
              <Button
                onClick={resetVerification}
                className="bg-yellow-600 hover:bg-yellow-700"
                size="lg"
              >
                Try Another Code
              </Button>
            </div>
          </Card>
        )}

        {/* Already Completed */}
        {state === 'completed' && reservation && (
          <Card className="mb-6 border-2 border-blue-300 shadow-lg" ref={resultRef}>
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Already Completed
              </h3>
              <p className="text-gray-600 mb-2">
                This reservation has already been fulfilled.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 mb-6 inline-block">
                <p className="text-sm text-blue-900 mb-1">
                  <span className="font-medium">Driver:</span> {reservation.driver_name}
                </p>
                <p className="text-sm text-blue-900">
                  <span className="font-medium">Fuel Dispensed:</span> {reservation.quantity}L of{' '}
                  {reservation.fuel_type_name}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Completed: {new Date(reservation.completed_at).toLocaleString()}
                </p>
              </div>
              <br />
              <Button
                onClick={resetVerification}
                variant="outline"
                size="lg"
              >
                Verify Another Code
              </Button>
            </div>
          </Card>
        )}

        {/* Help Text */}
        {state === 'idle' && (
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <QrCode className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">How to verify:</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Ask the driver for their 6-digit pickup code</li>
                  <li>• Enter the code in the field above</li>
                  <li>• Click "Verify Code" or press Enter</li>
                  <li>• Review the reservation details</li>
                  <li>• Click "Authorize & Dispense Fuel" to complete</li>
                </ul>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}