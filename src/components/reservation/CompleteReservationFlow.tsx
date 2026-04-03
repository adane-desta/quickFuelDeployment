import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { reservationService } from '../../lib/supabase/database-advanced';
import { notifications, notifyError } from '../../lib/utils/notifications';
import type { Station, TimeSlot } from '../../types/advanced';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { StationSelection } from './StationSelection';
import { TimeSlotSelector } from './TimeSlotSelector';
import { FuelTypeSelector } from './FuelTypeSelector';
import { PaymentProcessor } from './PaymentProcessor';
import { ReservationConfirmation } from './ReservationConfirmation';

const STEPS = [
  { id: 1, name: 'Station', description: 'Select fuel station' },
  { id: 2, name: 'Time Slot', description: 'Choose date & time' },
  { id: 3, name: 'Fuel', description: 'Select fuel type & quantity' },
  { id: 4, name: 'Payment', description: 'Complete payment' },
  { id: 5, name: 'Confirmation', description: 'Get pickup code' },
];

export function CompleteReservationFlow() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [fuelData, setFuelData] = useState<{
    fuelTypeId: string;
    quantity: number;
    pricePerLiter: number;
    totalPrice: number;
  } | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);

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
    setFuelData({ fuelTypeId, quantity, pricePerLiter, totalPrice });
  };

  const handleProceedToPayment = async () => {
    console.log('=== handleProceedToPayment called ===');
    console.log('user:', user);
    console.log('selectedStation:', selectedStation);
    console.log('selectedTimeSlot:', selectedTimeSlot);
    console.log('fuelData:', fuelData);

    if (!user || !selectedStation || !selectedTimeSlot || !fuelData) {
      console.error('Missing data for reservation');
      notifyError('Missing required information');
      return;
    }

    setCreating(true);
    try {
      console.log('Calling reservationService.createReservation...');
      const resId = await reservationService.createReservation(
        {
          station_id: selectedStation.id,
          time_slot_id: selectedTimeSlot.id,
          fuel_type_id: fuelData.fuelTypeId,
          quantity: fuelData.quantity,
          payment_method: 'Telebirr',
        },
        user.id
      );
      console.log('resId returned:', resId);
      if (resId) {
        setReservationId(resId);
        setCurrentStep(4);
      } else {
        throw new Error('Reservation creation returned null');
      }
    } catch (error: any) {
      console.error('Reservation creation error:', error);
      notifyError('Failed to create reservation', error);
    } finally {
      setCreating(false);
    }
  };

  const handlePaymentSuccess = () => {
    setCurrentStep(5);
    notifications.reservation.created('Reservation confirmed!');
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setSelectedStation(null);
    setSelectedTimeSlot(null);
    setFuelData(null);
    setReservationId(null);
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-4 mb-4">
            {currentStep > 1 && currentStep < 5 && (
              <Button variant="ghost" size="sm" onClick={handleBack} disabled={creating}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold">{STEPS[currentStep - 1].name}</h1>
              <p className="text-sm text-gray-600">{STEPS[currentStep - 1].description}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Step {currentStep} of {STEPS.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <div className="flex justify-between mt-4 md:hidden">
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
                {step.id < currentStep ? <Check className="w-4 h-4" /> : step.id}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {currentStep === 1 && (
          <StationSelection station={selectedStation} onNext={handleStationSelect} />
        )}
        {currentStep === 2 && selectedStation && (
          <TimeSlotSelector
            stationId={selectedStation.id}
            onSelectSlot={handleTimeSlotSelect}
            selectedSlotId={selectedTimeSlot?.id}
          />
        )}
        {currentStep === 3 && selectedStation && (
          <>
            <FuelTypeSelector
              stationId={selectedStation.id}
              onSelectFuel={handleFuelSelect}
              selectedFuelTypeId={fuelData?.fuelTypeId}
              selectedQuantity={fuelData?.quantity}
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
                    Creating Reservation...
                  </>
                ) : (
                  'Proceed to Payment'
                )}
              </Button>
            </div>
          </>
        )}
        {currentStep === 4 && reservationId && fuelData && (
          <PaymentProcessor
            reservationId={reservationId}
            amount={fuelData.totalPrice}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentCancel={handleBack}
          />
        )}
        {currentStep === 5 && reservationId && (
          <ReservationConfirmation
            reservationId={reservationId}
            onViewReservations={() => navigate('/driver/reservations')}
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </div>
  );
}