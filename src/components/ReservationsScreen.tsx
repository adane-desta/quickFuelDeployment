import { useState } from 'react';
import { Calendar, MapPin, Fuel, Clock, CheckCircle, XCircle, AlertCircle, Navigation } from 'lucide-react';

interface Reservation {
  id: string;
  station: string;
  date: string;
  timeSlot: string;
  fuelType: 'Petrol' | 'Diesel';
  quantity: number;
  totalCost: number;
  pickupCode: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  distance: number;
}

const mockReservations: Reservation[] = [
  {
    id: '1',
    station: 'Shell Station Downtown',
    date: '2025-12-12',
    timeSlot: '09:00 - 10:00',
    fuelType: 'Petrol',
    quantity: 25,
    totalCost: 1625,
    pickupCode: '483920',
    status: 'confirmed',
    distance: 0.5,
  },
  {
    id: '2',
    station: 'Total Energy',
    date: '2025-12-11',
    timeSlot: '14:00 - 15:00',
    fuelType: 'Diesel',
    quantity: 30,
    totalCost: 1740,
    pickupCode: '729184',
    status: 'completed',
    distance: 2.3,
  },
  {
    id: '3',
    station: 'BP Express',
    date: '2025-12-10',
    timeSlot: '11:00 - 12:00',
    fuelType: 'Petrol',
    quantity: 20,
    totalCost: 1300,
    pickupCode: '156473',
    status: 'cancelled',
    distance: 1.2,
  },
  {
    id: '4',
    station: 'ExxonMobil Center',
    date: '2025-12-15',
    timeSlot: '16:00 - 17:00',
    fuelType: 'Petrol',
    quantity: 35,
    totalCost: 2275,
    pickupCode: '892746',
    status: 'confirmed',
    distance: 3.0,
  },
];

export function ReservationsScreen() {
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'completed' | 'cancelled'>('all');

  const filteredReservations = mockReservations.filter(reservation => {
    if (filter === 'all') return true;
    return reservation.status === filter;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusConfig = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed':
        return {
          color: 'bg-green-100 text-green-700 border-green-300',
          icon: CheckCircle,
          label: 'Confirmed',
        };
      case 'completed':
        return {
          color: 'bg-blue-100 text-blue-700 border-blue-300',
          icon: CheckCircle,
          label: 'Completed',
        };
      case 'cancelled':
        return {
          color: 'bg-red-100 text-red-700 border-red-300',
          icon: XCircle,
          label: 'Cancelled',
        };
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-6 shadow-md">
        <h1 className="text-white mb-2">My Reservations</h1>
        <p className="text-blue-100 text-sm">View and manage your fuel reservations</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({mockReservations.length})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              filter === 'confirmed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Confirmed ({mockReservations.filter(r => r.status === 'confirmed').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              filter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed ({mockReservations.filter(r => r.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              filter === 'cancelled'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancelled ({mockReservations.filter(r => r.status === 'cancelled').length})
          </button>
        </div>
      </div>

      {/* Reservations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredReservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <AlertCircle className="w-16 h-16 mb-4 text-gray-400" />
            <p className="text-center">No reservations found</p>
          </div>
        ) : (
          filteredReservations.map((reservation) => {
            const statusConfig = getStatusConfig(reservation.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={reservation.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-gray-900 mb-1">{reservation.station}</h3>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{reservation?.distance} km away</span>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Navigation className="w-5 h-5 text-blue-600" />
                  </button>
                </div>

                {/* Status Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-3 ${statusConfig.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  <span className="text-sm">{statusConfig.label}</span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="text-sm text-gray-900">{formatDate(reservation.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Time Slot</p>
                      <p className="text-sm text-gray-900">{reservation.timeSlot}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Fuel</p>
                      <p className="text-sm text-gray-900">{reservation.fuelType} - {reservation.quantity}L</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Total Cost</p>
                    <p className="text-sm text-gray-900">ETB {reservation.totalCost}</p>
                  </div>
                </div>

                {/* Pickup Code - Only for confirmed */}
                {reservation.status === 'confirmed' && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200 mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Pickup Code</p>
                        <p className="text-xl tracking-wider text-gray-900">{reservation.pickupCode}</p>
                      </div>
                      <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                        Show QR
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {reservation.status === 'confirmed' && (
                    <>
                      <button className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        View Details
                      </button>
                      <button className="py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                        Cancel
                      </button>
                    </>
                  )}
                  {reservation.status === 'completed' && (
                    <button className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      View Receipt
                    </button>
                  )}
                  {reservation.status === 'cancelled' && (
                    <button className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Book Again
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
