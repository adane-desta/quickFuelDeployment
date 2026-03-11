import { StationCard } from './StationCard';
import { Station } from '../types';
import { Fuel } from 'lucide-react';

interface ListViewProps {
  stations: Station[];
  onReserve?: (station: Station) => void;
}

export function ListView({ stations, onReserve }: ListViewProps) {
  if (stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
        <Fuel className="w-16 h-16 mb-4 text-gray-400" />
        <p className="text-center">No fuel stations found matching your search</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-3">
      {stations.map((station) => (
        <StationCard key={station.id} station={station} onReserve={onReserve} />
      ))}
    </div>
  );
}