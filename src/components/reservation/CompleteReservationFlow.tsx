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

const STEPS = [
  { id: 1, name: 'Station', description: 'Select fuel station' },
  { id: 2, name: 'Time Slot', description: 'Choose date & time' },
  { id: 3, name: 'Fuel', description: 'Select fuel type & quantity' },
  { id: 4, name: 'Payment', description: 'Complete payment' },
  { id: 5, name: 'Confirmation', description: 'Get pickup code' },
];

export function CompleteReservationFlow({
  station: initialStation = null,
  onClose,
}: CompleteReservationFlowProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchParams] = useSearchParams();

  const paymentStatus = searchParams.get('payment');
  const reservationIdFromUrl = searchParams.get('reservationId');
  const stationIdFromUrl = searchParams.get('stationId');

  const [restoringState, setRestoringState] = useState(false);
  const [creating, setCreating] = useState(false);

  const [currentStep, setCurrentStep] = useState(() => {
    if (paymentStatus === 'success' && reservationIdFromUrl) {
      return 5;
    }

    if (initialStation) {
      return 2;
    }

    return 1;
  });

  const [selectedStation, setSelectedStation] =
    useState<Station | null>(initialStation);

  const [selectedTimeSlot, setSelectedTimeSlot] =
    useState<TimeSlot | null>(null);

  const [preferredFuelId, setPreferredFuelId] =
    useState<string | null>(null);

  const [fuelData, setFuelData] = useState<{
    fuelTypeId: string;
    quantity: number;
    pricePerLiter: number;
    totalPrice: number;
  } | null>(null);

  const [reservationId, setReservationId] =
    useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  /*
    ==========================================
    FETCH DRIVER PREFERRED FUEL
    ==========================================
  */
  useEffect(() => {
    const fetchDriverPref = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('preferred_fuel_type_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setPreferredFuelId(data?.preferred_fuel_type_id || null);
    };

    fetchDriverPref();
  }, [user]);

  /*
    ==========================================
    RESTORE PAYMENT FLOW AFTER CHAPA REDIRECT
    ==========================================
  */
  useEffect(() => {
    const restorePaymentFlow = async () => {
      if (
        paymentStatus !== 'success' ||
        !reservationIdFromUrl
      ) {
        return;
      }

      setRestoringState(true);

      try {
        console.log('Restoring payment flow...');

        // Restore reservation id
        setReservationId(reservationIdFromUrl);

        // Restore station from URL
        if (stationIdFromUrl) {
          const { data: stationData, error } = await supabase
            .from('stations')
            .select('*')
            .eq('id', stationIdFromUrl)
            .single();

          if (error) {
            console.error(
              'Failed to restore station:',
              error
            );
          }

          if (stationData) {
            console.log(
              'Restored station:',
              stationData
            );

            setSelectedStation(stationData);
          }
        }

        // OPTIONAL:
        // Verify reservation payment status
        const { data: reservationData, error: reservationError } =
          await supabase
            .from('reservations')
            .select('status, payment_status')
            .eq('id', reservationIdFromUrl)
            .single();

        if (reservationError) {
          console.error(
            'Reservation verification failed:',
            reservationError
          );
        }

        console.log(
          'Reservation verification:',
          reservationData
        );

        // Move to confirmation
        setCurrentStep(5);

        notifications.reservation.created(
          'Reservation confirmed!'
        );

      } catch (error) {
        console.error(
          'Error restoring payment flow:',
          error
        );
      } finally {
        setRestoringState(false);

        // Clean URL
        window.history.replaceState(
          {},
          '',
          window.location.pathname
        );
      }
    };

    restorePaymentFlow();
  }, [
    paymentStatus,
    reservationIdFromUrl,
    stationIdFromUrl,
  ]);

  /*
    ==========================================
    SCROLL TO TOP ON STEP CHANGE
    ==========================================
  */
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [currentStep]);

  /*
    ==========================================
    DEBUG LOGGING
    ==========================================
  */
  useEffect(() => {
    console.log('DEBUG FLOW STATE', {
      currentStep,
      selectedStation,
      selectedTimeSlot,
      fuelData,
      reservationId,
    });
  }, [
    currentStep,
    selectedStation,
    selectedTimeSlot,
    fuelData,
    reservationId,
  ]);

  /*
    ==========================================
    HANDLERS
    ==========================================
  */
  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
    setCurrentStep(2);
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    setCurrentStep(3);
  };

  const handleFuelSelect = (
    fuelTypeId: string,
    quantity: number,
    pricePerLiter: number,
    totalPrice: number
  ) => {
    setFuelData({
      fuelTypeId,
      quantity,
      pricePerLiter,
      totalPrice,
    });
  };

  const handleProceedToPayment = async () => {
    console.log('=== handleProceedToPayment called ===');

    console.log('user:', user);
    console.log('selectedStation:', selectedStation);
    console.log('selectedTimeSlot:', selectedTimeSlot);
    console.log('fuelData:', fuelData);

    if (
      !user ||
      !selectedStation ||
      !selectedTimeSlot ||
      !fuelData
    ) {
      console.error('Missing reservation data');

      notifyError('Missing required information');

      return;
    }

    setCreating(true);

    try {
      const resId =
        await reservationService.createReservation(
          {
            station_id: selectedstation?.id,
            time_slot_id: selectedTimeSlot.id,
            fuel_type_id: fuelData.fuelTypeId,
            quantity: fuelData.quantity,
            payment_method: 'Telebirr',
          },
          user.id
        );

      if (!resId) {
        throw new Error(
          'Reservation creation returned null'
        );
      }

      setReservationId(resId);

      setCurrentStep(4);

    } catch (error: any) {
      console.error(
        'Reservation creation error:',
        error
      );

      notifyError(
        'Failed to create reservation',
        error
      );
    } finally {
      setCreating(false);
    }
  };

  const handlePaymentSuccess = () => {
    setCurrentStep(5);

    notifications.reservation.created(
      'Reservation confirmed!'
    );
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(initialStation ? 2 : 1);

    setSelectedStation(initialStation || null);

    setSelectedTimeSlot(null);

    setFuelData(null);

    setReservationId(null);
  };

  /*
    ==========================================
    LOADING SCREEN DURING PAYMENT RESTORE
    ==========================================
  */
  if (restoringState) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />

          <p className="text-gray-600">
            Restoring reservation...
          </p>
        </div>
      </div>
    );
  }

  const progress =
    (currentStep / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom max-h-[90vh] flex flex-col">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-gray-900">
              Reserve Fuel
            </h2>

            <p className="text-sm text-gray-600">
              Complete your reservation
            </p>
          </div>

          <button
            onClick={
              onClose
                ? onClose
                : () => navigate(-1)
            }
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* STEP INDICATOR */}
        <div className="bg-white px-6 py-2 border-b">
          <div className="flex items-center gap-4 mb-2">

            {currentStep > 1 &&
              currentStep < 5 && (
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
                {STEPS[currentStep - 1]?.name ||
                  'Unknown'}
              </h1>

              <p className="text-sm text-gray-600">
                {STEPS[currentStep - 1]
                  ?.description || ''}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>
                Step {currentStep} of{' '}
                {STEPS.length}
              </span>

              <span>
                {Math.round(progress)}%
                Complete
              </span>
            </div>

            <Progress
              value={progress}
              className="h-2"
            />
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

        {/* CONTENT */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-6 py-6"
        >
          {/* STEP 1 */}
          {currentStep === 1 &&
            !initialStation && (
              <StationSelection
                onSelectStation={
                  handleStationSelect
                }
              />
            )}

          {/* STEP 2 */}
          {currentStep === 2 &&
            selectedStation && (
              <TimeSlotSelector
                stationId={selectedstation?.id}
                onSelectSlot={
                  handleTimeSlotSelect
                }
                selectedSlotId={
                  selectedTimeSlot?.id
                }
              />
            )}

          {/* STEP 3 */}
          {currentStep === 3 &&
            selectedStation && (
              <>
                <FuelTypeSelector
                  stationId={
                    selectedstation?.id
                  }
                  onSelectFuel={
                    handleFuelSelect
                  }
                  selectedFuelTypeId={
                    fuelData?.fuelTypeId
                  }
                  selectedQuantity={
                    fuelData?.quantity
                  }
                  preferredFuelTypeId={
                    preferredFuelId
                  }
                />

                <div className="mt-6">
                  <Button
                    onClick={
                      handleProceedToPayment
                    }
                    disabled={
                      !fuelData || creating
                    }
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />

                        Creating
                        Reservation...
                      </>
                    ) : (
                      'Proceed to Payment'
                    )}
                  </Button>
                </div>
              </>
            )}

          {/* STEP 4 */}
          {currentStep === 4 &&
            reservationId &&
            fuelData && (
              <PaymentProcessor
                reservationId={
                  reservationId
                }
                amount={
                  fuelData.totalPrice
                }
                onPaymentSuccess={
                  handlePaymentSuccess
                }
                onPaymentCancel={
                  handleBack
                }
              />
            )}

          {/* STEP 5 */}
          {currentStep === 5 &&
            reservationId && (
              <ReservationConfirmation
                reservationId={
                  reservationId
                }
                onViewReservations={() => {
                  if (onClose) {
                    onClose();
                  }

                  navigate(
                    '/driver/reservations'
                  );
                }}
                onStartOver={
                  handleStartOver
                }
              />
            )}
        </div>
      </div>
    </div>
  );
}