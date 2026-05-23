import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, Check, X } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { reservationService } from '../../lib/supabase/database-advanced';
import { notifications, notifyError } from '../../lib/utils/notifications';
import type { Station, TimeSlot } from '../../types/advanced';

import { Button } from '../ui/button';
import { Progress } from '../ui/progress';

import { supabase } from '../../lib/supabase/client';

import { StationSelection } from './StationSelection';
import { TimeSlotSelector } from './TimeSlotSelector';
import { FuelTypeSelector } from './FuelTypeSelector';
import { PaymentProcessor } from './PaymentProcessor';
import { ReservationConfirmation } from './ReservationConfirmation';

interface CompleteReservationFlowProps {
  station?: Station | null;
  onClose?: () => void;
}

const STORAGE_KEY = 'pendingReservationFlow';

const STEPS = [
  { id: 1, name: 'Station',      description: 'Select fuel station' },
  { id: 2, name: 'Time Slot',    description: 'Choose date & time' },
  { id: 3, name: 'Fuel',         description: 'Select fuel type & quantity' },
  { id: 4, name: 'Payment',      description: 'Complete payment' },
  { id: 5, name: 'Confirmation', description: 'Get pickup code' },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Returns true when the current URL carries a Chapa success callback. */
function isChapaSuccessReturn(params: URLSearchParams): boolean {
  return (
    params.get('status')  === 'success' ||   // Chapa standard
    params.get('payment') === 'success'       // Legacy / custom
  );
}

/** Returns true when there is a pending reservation saved in localStorage. */
function hasPendingFlow(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return typeof parsed?.reservationId === 'string' && parsed.reservationId.length > 0;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function CompleteReservationFlow({
  station: initialStation = null,
  onClose,
}: CompleteReservationFlowProps) {
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [searchParams] = useSearchParams();

  // Detect whether this render is a return from Chapa.
  // We compute this once and store it in a ref so it never changes between renders.
  const isPaymentReturnRef = useRef(
    isChapaSuccessReturn(searchParams) || hasPendingFlow()
  );
  const isPaymentReturn = isPaymentReturnRef.current;

  const contentRef = useRef<HTMLDivElement>(null);

  // ── State ────────────────────────────────────────────────────────────────
  const [restoringState, setRestoringState] = useState(isPaymentReturn);
  const [creating,       setCreating]       = useState(false);

  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (isPaymentReturn) return 5;
    if (initialStation)  return 2;
    return 1;
  });

  const [selectedStation,  setSelectedStation]  = useState<Station | null>(initialStation);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [preferredFuelId,  setPreferredFuelId]  = useState<string | null>(null);
  const [fuelData, setFuelData] = useState<{
    fuelTypeId: string;
    quantity: number;
    pricePerLiter: number;
    totalPrice: number;
  } | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH DRIVER'S PREFERRED FUEL TYPE
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('users')
        .select('preferred_fuel_type_id')
        .eq('id', user.id)
        .single();
      setPreferredFuelId(data?.preferred_fuel_type_id || null);
    };
    fetch();
  }, [user]);

  // ─────────────────────────────────────────────────────────────────────────
  // RESTORE FLOW AFTER CHAPA REDIRECT
  //
  // Runs once on mount (empty deps) when this is a payment-return render.
  // Reads the saved reservation ID from localStorage, confirms the payment
  // in the DB, then shows the confirmation screen.
  //
  // Design decisions:
  // • confirmPayment failure is NON-FATAL – the pickup code already exists;
  //   the operator can still dispense fuel. We log and continue.
  // • We set `reservationId` BEFORE clearing `restoringState` so the step-5
  //   render never sees the "!reservationId" branch.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPaymentReturn) return;

    const restoreFlow = async () => {
      // Ensure spinner is showing
      setRestoringState(true);

      try {
        // ── 1. Read saved state ────────────────────────────────────────────
        const savedRaw = localStorage.getItem(STORAGE_KEY);

        if (!savedRaw) {
          console.warn('[QuickFuel] Payment return detected but localStorage is empty.');
          // Clean the URL and send the user back to the start
          window.history.replaceState({}, '', window.location.pathname);
          setCurrentStep(initialStation ? 2 : 1);
          setRestoringState(false);
          return;
        }

        let parsed: any;
        try {
          parsed = JSON.parse(savedRaw);
        } catch {
          console.error('[QuickFuel] localStorage parse failed.');
          localStorage.removeItem(STORAGE_KEY);
          window.history.replaceState({}, '', window.location.pathname);
          setCurrentStep(initialStation ? 2 : 1);
          setRestoringState(false);
          return;
        }

        const savedReservationId: string | null = parsed?.reservationId || null;

        if (!savedReservationId) {
          console.warn('[QuickFuel] reservationId missing from saved flow.');
          localStorage.removeItem(STORAGE_KEY);
          window.history.replaceState({}, '', window.location.pathname);
          setCurrentStep(initialStation ? 2 : 1);
          setRestoringState(false);
          return;
        }

        // ── 2. Confirm payment in DB (non-fatal) ───────────────────────────
        try {
          const txRef =
            searchParams.get('trx_ref') ||
            searchParams.get('tx_ref')  ||
            `TXN-CHAPA-${Date.now()}`;

          await reservationService.confirmPayment(savedReservationId, txRef);
        } catch (paymentErr) {
          // Non-fatal: log and continue showing the confirmation screen
          console.error('[QuickFuel] confirmPayment failed (non-fatal):', paymentErr);
        }

        // ── 3. Set reservationId FIRST, then clear the spinner ─────────────
        // React batches these updates, but we set reservationId before
        // restoringState so the step-5 render always sees a valid ID.
        setReservationId(savedReservationId);
        setSelectedStation(parsed.station   || null);
        setSelectedTimeSlot(parsed.timeSlot || null);
        setFuelData(parsed.fuelData         || null);
        setCurrentStep(5);

        notifications.reservation.created('Reservation confirmed!');

        // ── 4. Clean up ────────────────────────────────────────────────────
        localStorage.removeItem(STORAGE_KEY);
        window.history.replaceState({}, '', window.location.pathname);

      } catch (err: any) {
        console.error('[QuickFuel] restoreFlow unexpected error:', err);
        notifyError(
          'Could not restore your reservation. Please check your reservations.',
          err
        );
      } finally {
        // Always clear the spinner — even if something went wrong
        setRestoringState(false);
      }
    };

    restoreFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // ─────────────────────────────────────────────────────────────────────────
  // SCROLL TO TOP ON STEP CHANGE
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [currentStep]);

  // ─────────────────────────────────────────────────────────────────────────
  // STEP HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  const handleStationSelect  = (s: Station)   => { setSelectedStation(s);  setCurrentStep(2); };
  const handleTimeSlotSelect = (slot: TimeSlot) => { setSelectedTimeSlot(slot); setCurrentStep(3); };

  const handleFuelSelect = (
    fuelTypeId: string,
    quantity: number,
    pricePerLiter: number,
    totalPrice: number
  ) => {
    setFuelData({ fuelTypeId, quantity, pricePerLiter, totalPrice });
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleStartOver = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentStep(initialStation ? 2 : 1);
    setSelectedStation(initialStation || null);
    setSelectedTimeSlot(null);
    setFuelData(null);
    setReservationId(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE RESERVATION → SAVE TO LOCALSTORAGE → GO TO PAYMENT
  // ─────────────────────────────────────────────────────────────────────────
  const handleProceedToPayment = async () => {
    if (!user || !selectedStation || !selectedTimeSlot || !fuelData) {
      notifyError('Missing required information');
      return;
    }

    setCreating(true);

    try {
      const resId = await reservationService.createReservation(
        {
          station_id:     selectedStation.id,
          time_slot_id:   selectedTimeSlot.id,
          fuel_type_id:   fuelData.fuelTypeId,
          quantity:       fuelData.quantity,
          payment_method: 'Chapa',
        },
        user.id
      );

      if (!resId) throw new Error('Reservation creation failed. Please try again.');

      // Save the full flow state to localStorage BEFORE the Chapa redirect.
      // restoreFlow() reads this back when Chapa returns.
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          reservationId: resId,
          station:       selectedStation,
          timeSlot:      selectedTimeSlot,
          fuelData,
        })
      );

      setReservationId(resId);
      setCurrentStep(4);

    } catch (err: any) {
      console.error('[QuickFuel] handleProceedToPayment error:', err);
      notifyError('Failed to create reservation', err);
    } finally {
      setCreating(false);
    }
  };

  // Called by PaymentProcessor when payment succeeds WITHOUT a page redirect
  const handlePaymentSuccess = () => {
    setCurrentStep(5);
    notifications.reservation.created('Reservation confirmed!');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FULL-SCREEN SPINNER (shown while restoring state after Chapa redirect)
  // ─────────────────────────────────────────────────────────────────────────
  if (restoringState) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          <p className="text-gray-700 font-medium">Confirming your reservation…</p>
          <p className="text-sm text-gray-400">Please wait a moment</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom max-h-[90vh] flex flex-col">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-gray-900">Reserve Fuel</h2>
            <p className="text-sm text-gray-600">Complete your reservation</p>
          </div>
          <button
            onClick={onClose ? onClose : () => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* STEP INDICATOR */}
        <div className="bg-white px-6 py-2 border-b">
          <div className="flex items-center gap-4 mb-2">
            {currentStep > 1 && currentStep < 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={creating}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold">
                {STEPS[currentStep - 1]?.name || ''}
              </h1>
              <p className="text-sm text-gray-600">
                {STEPS[currentStep - 1]?.description || ''}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Step {currentStep} of {STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex justify-between mt-4">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium ${
                  step.id < currentStep
                    ? 'bg-green-600 text-white'
                    : step.id === currentStep
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.id < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </div>
            ))}
          </div>
        </div>

        {/* STEP CONTENT */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-6 py-6">

          {/* STEP 1 — Station Selection */}
          {currentStep === 1 && !initialStation && (
            <StationSelection onSelectStation={handleStationSelect} />
          )}

          {/* STEP 2 — Time Slot */}
          {currentStep === 2 && selectedStation && (
            <TimeSlotSelector
              stationId={selectedStation.id}
              onSelectSlot={handleTimeSlotSelect}
              selectedSlotId={selectedTimeSlot?.id}
            />
          )}

          {/* STEP 3 — Fuel Type & Quantity */}
          {currentStep === 3 && selectedStation && (
            <>
              <FuelTypeSelector
                stationId={selectedStation.id}
                onSelectFuel={handleFuelSelect}
                selectedFuelTypeId={fuelData?.fuelTypeId}
                selectedQuantity={fuelData?.quantity}
                preferredFuelTypeId={preferredFuelId}
              />
              <div className="mt-6">
                <Button
                  onClick={handleProceedToPayment}
                  disabled={!fuelData || creating}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Creating Reservation…
                    </>
                  ) : (
                    'Proceed to Payment'
                  )}
                </Button>
              </div>
            </>
          )}

          {/* STEP 4 — Payment */}
          {currentStep === 4 && reservationId && fuelData && (
            <PaymentProcessor
              reservationId={reservationId}
              amount={fuelData.totalPrice}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentCancel={handleBack}
            />
          )}

          {/* STEP 5 — Confirmation */}
          {currentStep === 5 && (
            <>
              {reservationId ? (
                <ReservationConfirmation
                  reservationId={reservationId}
                  onViewReservations={() => {
                    if (onClose) onClose();
                    navigate('/driver/reservations');
                  }}
                  onStartOver={handleStartOver}
                />
              ) : (
                /*
                 * Safety fallback: reservationId is null at step 5.
                 * This should no longer happen with the fixed restoreFlow,
                 * but we give the user an escape hatch instead of an
                 * infinite spinner.
                 */
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                  <p className="text-gray-600 text-center">Loading your confirmation…</p>
                  <p className="text-sm text-gray-400 text-center">
                    If this takes too long,{' '}
                    <button
                      className="text-blue-600 underline font-medium"
                      onClick={() => {
                        if (onClose) onClose();
                        navigate('/driver/reservations');
                      }}
                    >
                      check your reservations
                    </button>
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
