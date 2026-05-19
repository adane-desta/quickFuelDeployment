import { MapPin, Clock, Users, Fuel, CheckCircle } from 'lucide-react';
import { Station } from '../../types';

interface StationSelectionProps {
  station: Station;
  onNext: () => void;
}

export function StationSelection({ station, onNext }: StationSelectionProps) {
  const queueColors = {
    Short: 'bg-green-100 text-green-700 border-green-300',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    Long: 'bg-red-100 text-red-700 border-red-300',
  };

  const queueDotColors = {
    Short: 'bg-green-500',
    Medium: 'bg-yellow-500',
    Long: 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-gray-900 mb-2">Selected Station</h3>
        <p className="text-gray-600">Review station details before proceeding</p>
      </div>

      {/* Station Card */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Fuel className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-gray-900 mb-1">{station?.name}</h4>
            <div className="flex items-center gap-1.5 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{station?.distance} km away</span>
            </div>
          </div>
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>

        {/* Queue Status */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-4 ${queueColors[station.queueLength]}`}>
          <span className={`w-2 h-2 rounded-full ${queueDotColors[station.queueLength]} animate-pulse`}></span>
          <Users className="w-4 h-4" />
          <span className="text-sm">{station.queueLength} Queue</span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500">Wait Time</span>
            </div>
            <p className="text-gray-900">~{station.waitTime} min</p>
          </div>

          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Fuel className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500">Available</span>
            </div>
            <div className="flex gap-1">
              {station.petrolAvailable && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Petrol</span>
              )}
              {station.dieselAvailable && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Diesel</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={onNext}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Continue to Time Selection
      </button>
    </div>
  );
}