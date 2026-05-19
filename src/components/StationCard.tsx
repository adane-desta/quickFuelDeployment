import { MapPin, Clock, Users, Fuel, Navigation } from 'lucide-react';
import { Station } from '../types';

interface StationCardProps {
  station: Station;
  onReserve?: (station: Station) => void;
}

export function StationCard({ station, onReserve }: StationCardProps) {
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

  const getWaitTimeFromQueue = (queue: string) => {
    switch (queue) {
      case 'Short': return '5-10';
      case 'Medium': return '15-30';
      case 'Long': return '30+';
      default: return '?';
    }
  };

  const availableFuels = station.availableFuels || 
    (station.petrolAvailable ? ['Petrol'] : []).concat(station.dieselAvailable ? ['Diesel'] : []);

  const waitTime = station.waitTime || getWaitTimeFromQueue(station?.queueLength);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-gray-900 mb-1">{station?.name}</h3>
          <div className="flex items-center gap-1.5 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{station?.distance?.toFixed(1) || '?'} km away</span>
          </div>
          {station.travelTime !== undefined && (
            <div className="flex items-center gap-1.5 text-gray-600 mt-0.5">
              <Clock className="w-3 h-3" />
              <span className="text-xs">~{station.travelTime} min drive</span>
            </div>
          )}
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Navigation className="w-5 h-5 text-blue-600" />
        </button>
      </div>

      {/* Queue Status */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-3 ${queueColors[station?.queueLength]}`}>
        <span className={`w-2 h-2 rounded-full ${queueDotColors[station?.queueLength]} animate-pulse`}></span>
        <Users className="w-4 h-4" />
        <span className="text-sm">{station?.queueLength} Queue</span>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Wait Time</p>
            <p className="text-gray-900">~{waitTime} min</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Fuel className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Available</p>
            <div className="flex flex-wrap gap-1">
              {availableFuels.length > 0 ? (
                availableFuels.map(fuel => (
                  <span key={fuel} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {fuel}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500">None</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button 
          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          disabled={availableFuels.length === 0}
          onClick={() => onReserve?.(station)}
        >
          Reserve Fuel
        </button>
      </div>
    </div>
  );
}