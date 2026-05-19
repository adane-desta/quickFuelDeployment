import { useState } from 'react';
import { Fuel, Minus, Plus, ChevronLeft } from 'lucide-react';
import { Station } from '../../types';

interface FuelSelectionProps {
  station: Station;
  fuelType: 'Petrol' | 'Diesel';
  quantity: number;
  onUpdate: (fuelType: 'Petrol' | 'Diesel', quantity: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function FuelSelection({
  station,
  fuelType,
  quantity,
  onUpdate,
  onNext,
  onBack,
}: FuelSelectionProps) {
  const [localFuelType, setLocalFuelType] = useState(fuelType);
  const [localQuantity, setLocalQuantity] = useState(quantity);

  const pricePerLiter = {
    Petrol: 65,
    Diesel: 58,
  };

  const handleFuelTypeChange = (type: 'Petrol' | 'Diesel') => {
    setLocalFuelType(type);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 5 && newQuantity <= 100) {
      setLocalQuantity(newQuantity);
    }
  };

  const handleContinue = () => {
    onUpdate(localFuelType, localQuantity);
    onNext();
  };

  const totalCost = localQuantity * pricePerLiter[localFuelType];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-gray-900 mb-2">Select Fuel Type & Quantity</h3>
        <p className="text-gray-600">Choose your fuel preferences</p>
      </div>

      {/* Fuel Type Selection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Fuel className="w-5 h-5 text-blue-600" />
          <h4 className="text-gray-900">Fuel Type</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleFuelTypeChange('Petrol')}
            disabled={!station.petrolAvailable}
            className={`p-4 rounded-lg border-2 transition-all ${
              localFuelType === 'Petrol'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${!station.petrolAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Fuel className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-gray-900 mb-1">Petrol</p>
              <p className="text-xs text-gray-500">ETB {pricePerLiter.Petrol}/L</p>
              {!station.petrolAvailable && (
                <p className="text-xs text-red-600 mt-1">Unavailable</p>
              )}
            </div>
          </button>

          <button
            onClick={() => handleFuelTypeChange('Diesel')}
            disabled={!station.dieselAvailable}
            className={`p-4 rounded-lg border-2 transition-all ${
              localFuelType === 'Diesel'
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${!station.dieselAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Fuel className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-gray-900 mb-1">Diesel</p>
              <p className="text-xs text-gray-500">ETB {pricePerLiter.Diesel}/L</p>
              {!station.dieselAvailable && (
                <p className="text-xs text-red-600 mt-1">Unavailable</p>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Quantity Selection */}
      <div>
        <h4 className="text-gray-900 mb-3">Quantity (Liters)</h4>
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => handleQuantityChange(localQuantity - 5)}
              className="w-12 h-12 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <Minus className="w-5 h-5 text-gray-600" />
            </button>

            <div className="text-center">
              <p className="text-4xl text-gray-900 mb-1">{localQuantity}</p>
              <p className="text-sm text-gray-500">liters</p>
            </div>

            <button
              onClick={() => handleQuantityChange(localQuantity + 5)}
              className="w-12 h-12 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={localQuantity}
            onChange={(e) => handleQuantityChange(Number(e.target.value))}
            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
          />

          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>5L</span>
            <span>100L</span>
          </div>
        </div>
      </div>

      {/* Cost Summary */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600">Unit Price:</span>
          <span className="text-gray-900">ETB {pricePerLiter[localFuelType]}/L</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600">Quantity:</span>
          <span className="text-gray-900">{localQuantity} Liters</span>
        </div>
        <div className="h-px bg-green-300 my-2"></div>
        <div className="flex items-center justify-between">
          <span className="text-gray-900">Total Cost:</span>
          <span className="text-green-700">ETB {totalCost}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}