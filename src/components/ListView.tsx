import { MapPin, Fuel, Clock, Users } from 'lucide-react';
import { Station } from '../../types';

interface ListViewProps {
  stations: Station[];
  onReserve: (station: Station) => void;
  onReportQueue?: (station: Station) => void;
}

export function ListView({ stations, onReserve, onReportQueue }: ListViewProps) {
  const getQueueColor = (queue: string) => {
    switch (queue) {
      case 'Short': return 'bg-green-100 text-green-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Long': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getWaitTime = (queue: string) => {
    switch (queue) {
      case 'Short': return '5-10 min';
      case 'Medium': return '15-30 min';
      case 'Long': return '30+ min';
      default: return '~ min';
    }
  };

  return (
    <div className="divide-y divide-gray-200">
      {stations.map(station => (
        <div key={station.id} className="bg-white p-4 hover:bg-gray-50 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-gray-900">{station.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <MapPin className="w-4 h-4" />
                <span>{station.address || 'Address not available'}</span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{station.distance ? station.distance.toFixed(1) : '?'} km away</span>
                </div>
                {station.travelTime !== undefined && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>~{station.travelTime} min drive</span>
                  </div>
                )}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getQueueColor(station.queueLength)}`}>
                  <Users className="w-3 h-3" />
                  <span>{station.queueLength}</span>
                </div>
                <div className="text-sm text-gray-500">
                  Wait: {getWaitTime(station.queueLength)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex flex-wrap gap-1 justify-end mb-2">
                {station.availableFuels?.map(fuel => (
                  <span key={fuel} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {fuel}
                  </span>
                ))}
                {(!station.availableFuels || station.availableFuels.length === 0) && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                    None
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onReserve(station)}
                  disabled={!station.availableFuels?.length}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    station.availableFuels?.length
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Reserve Fuel
                </button>
                {onReportQueue && (
                  <button
                    onClick={() => onReportQueue(station)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Report Queue
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}