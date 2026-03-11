import { useState } from 'react';
import { Station } from '../types';
import { X } from 'lucide-react';
import { StepIndicator } from './reservation/StepIndicator';
import { StationSelection } from './reservation/StationSelection';
import { TimeSlotSelection } from './reservation/TimeSlotSelection';
import { FuelSelection } from './reservation/FuelSelection';
import { PaymentSelection } from './reservation/PaymentSelection';
import { ConfirmationScreen } from './reservation/ConfirmationScreen';

interface ReservationFlowProps {
  station: Station;
  onClose: () => void;
}

export interface ReservationData {
  station: Station;
  date: string;
  timeSlot: string;
  fuelType: 'Petrol' | 'Diesel';
  quantity: number;
  paymentMethod: 'Telebirr' | 'Chapa' | null;
}

export function ReservationFlow({ station, onClose }: ReservationFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [reservationData, setReservationData] = useState<ReservationData>({
    station,
    date: '',
    timeSlot: '',
    fuelType: 'Petrol',
    quantity: 10,
    paymentMethod: null,
  });

  const totalSteps = 5;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateReservationData = (data: Partial<ReservationData>) => {
    setReservationData({ ...reservationData, ...data });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-gray-900">Reserve Fuel</h2>
            <p className="text-sm text-gray-600">Complete your reservation</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {currentStep === 1 && (
            <StationSelection
              station={reservationData.station}
              onNext={handleNext}
            />
          )}
          {currentStep === 2 && (
            <TimeSlotSelection
              selectedDate={reservationData.date}
              selectedTime={reservationData.timeSlot}
              onUpdate={(date, timeSlot) =>
                updateReservationData({ date, timeSlot })
              }
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && (
            <FuelSelection
              station={reservationData.station}
              fuelType={reservationData.fuelType}
              quantity={reservationData.quantity}
              onUpdate={(fuelType, quantity) =>
                updateReservationData({ fuelType, quantity })
              }
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 4 && (
            <PaymentSelection
              paymentMethod={reservationData.paymentMethod}
              onUpdate={(paymentMethod) =>
                updateReservationData({ paymentMethod })
              }
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 5 && (
            <ConfirmationScreen
              reservationData={reservationData}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}