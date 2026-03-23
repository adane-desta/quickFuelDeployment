import { Station } from '../types';
import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { StationCard } from './StationCard';

interface MapViewProps {
  stations: Station[];
  onReserve?: (station: Station) => void;
}

export function MapView({ stations, onReserve }: MapViewProps) {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  const getMarkerColor = (queueLength: string) => {
    switch (queueLength) {
      case 'Short':
        return 'text-green-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'Long':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="h-full relative">
      {/* Map Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
        {/* Grid pattern to simulate map */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Road lines */}
        <svg className="absolute inset-0 w-full h-full">
          <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#cbd5e0" strokeWidth="3" />
          <line x1="0" y1="60%" x2="100%" y2="60%" stroke="#cbd5e0" strokeWidth="3" />
          <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#cbd5e0" strokeWidth="3" />
          <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#cbd5e0" strokeWidth="3" />
        </svg>

        {/* Station Markers */}
        <div className="absolute inset-0 p-4">
          {stations.map((station, index) => {
            // Position stations in a grid-like pattern
            const positions = [
              { top: '15%', left: '25%' },
              { top: '25%', left: '60%' },
              { top: '40%', left: '35%' },
              { top: '55%', left: '70%' },
              { top: '70%', left: '20%' },
              { top: '75%', left: '55%' },
            ];
            const position = positions[index % positions.length];

            return (
              <button
                key={station.id}
                onClick={() => setSelectedStation(station)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110"
                style={{ top: position.top, left: position.left }}
              >
                <div className="relative">
                  <MapPin className={`w-10 h-10 drop-shadow-lg ${getMarkerColor(station.queueLength)}`} fill="currentColor" />
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-2 py-0.5 rounded shadow-sm text-xs">
                    {station.distance} km
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* User Location Marker */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
        </div>
      </div>

      {/* Selected Station Card */}
      {selectedStation && (
        <div className="absolute bottom-4 left-4 right-4 animate-in slide-in-from-bottom">
          <div className="relative">
            <button
              onClick={() => setSelectedStation(null)}
              className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors z-10 flex items-center justify-center"
            >
              ×
            </button>
            <StationCard station={selectedStation} onReserve={onReserve} />
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors">
          +
        </button>
        <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors">
          −
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3">
        <p className="text-xs text-gray-500 mb-2">Queue Status</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600" fill="currentColor" />
            <span className="text-xs">Short</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-yellow-600" fill="currentColor" />
            <span className="text-xs">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-600" fill="currentColor" />
            <span className="text-xs">Long</span>
          </div>
        </div>
      </div>
    </div>
  );
}