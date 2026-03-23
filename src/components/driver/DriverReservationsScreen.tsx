import { useState } from 'react';
import { Calendar, MapPin, Fuel, Clock, CheckCircle, XCircle, AlertCircle, Navigation, X, Loader2 } from 'lucide-react';
import { mockReservations } from '../../data/mockData';
import { Reservation } from '../../types';
import { QRCodeSVG } from 'qrcode.react';

export function DriverReservationsScreen() {
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'completed' | 'cancelled' | 'pending'>('all');
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations.filter(r => r.driverId === 'd1'));
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const filteredReservations = reservations.filter(reservation => {
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
        return { color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle, label: 'Confirmed' };
      case 'completed':
        return { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: CheckCircle, label: 'Completed' };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle, label: 'Cancelled' };
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: AlertCircle, label: 'Pending' };
    }
  };

  const handleCancel = async (id: string) => {
    setCancelling(id);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' as const } : r));
    setCancelling(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 lg:px-6 py-6 shadow-md">
        <h1 className="text-white mb-2">My Reservations</h1>
        <p className="text-blue-100 text-sm">View and manage your fuel reservations</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white px-4 lg:px-6 py-3 border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'confirmed', 'pending', 'completed', 'cancelled'] as const).map(f => {
            const count = f === 'all' ? reservations.length : reservations.filter(r => r.status === f).length;
            const colors: Record<string, string> = {
              all: 'bg-blue-600', confirmed: 'bg-green-600', pending: 'bg-yellow-600', completed: 'bg-blue-600', cancelled: 'bg-red-600'
            };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  filter === f ? `${colors[f]} text-white` : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Reservations List */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {filteredReservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <AlertCircle className="w-16 h-16 mb-4 text-gray-400" />
            <p className="text-center">No reservations found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredReservations.map((reservation) => {
              const statusConfig = getStatusConfig(reservation.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={reservation.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-gray-900 mb-1">{reservation.stationName}</h3>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{reservation.distance} km away</span>
                      </div>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusConfig.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="text-sm">{statusConfig.label}</span>
                    </div>
                  </div>

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
                      <p className="text-sm text-gray-900">ETB {reservation.totalCost.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Pickup Code */}
                  {reservation.status === 'confirmed' && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200 mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Pickup Code</p>
                          <p className="text-xl tracking-wider text-gray-900">{reservation.pickupCode}</p>
                        </div>
                        <button
                          onClick={() => setShowQR(reservation.id)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Show QR
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {reservation.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => setSelectedReservation(reservation)}
                          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleCancel(reservation.id)}
                          disabled={cancelling === reservation.id}
                          className="py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60"
                        >
                          {cancelling === reservation.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel'}
                        </button>
                      </>
                    )}
                    {reservation.status === 'completed' && (
                      <button
                        onClick={() => setSelectedReservation(reservation)}
                        className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        View Receipt
                      </button>
                    )}
                    {reservation.status === 'cancelled' && (
                      <button className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        Book Again
                      </button>
                    )}
                    {reservation.status === 'pending' && (
                      <button className="w-full py-2 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                        Complete Payment
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">QR Code</h3>
              <button onClick={() => setShowQR(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            {(() => {
              const r = reservations.find(x => x.id === showQR);
              if (!r) return null;
              return (
                <div className="text-center">
                  <div className="bg-white rounded-lg p-4 inline-block mb-4 border-2 border-gray-200">
                    <QRCodeSVG value={r.qrCode} size={200} />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Pickup Code</p>
                  <p className="text-2xl tracking-wider text-gray-900 mb-2">{r.pickupCode}</p>
                  <p className="text-xs text-gray-500">Show this code at {r.stationName}</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Reservation Detail Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900">Reservation Details</h3>
                <button onClick={() => setSelectedReservation(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Station</p>
                  <p className="text-gray-900">{selectedReservation.stationName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Date</p>
                    <p className="text-gray-900">{formatDate(selectedReservation.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Time</p>
                    <p className="text-gray-900">{selectedReservation.timeSlot}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fuel Type</p>
                    <p className="text-gray-900">{selectedReservation.fuelType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Quantity</p>
                    <p className="text-gray-900">{selectedReservation.quantity}L</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Cost</p>
                    <p className="text-gray-900">ETB {selectedReservation.totalCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Payment</p>
                    <p className="text-gray-900">{selectedReservation.paymentMethod}</p>
                  </div>
                </div>
                {selectedReservation.status === 'confirmed' && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200 text-center">
                    <div className="inline-block mb-3">
                      <QRCodeSVG value={selectedReservation.qrCode} size={140} />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Pickup Code</p>
                    <p className="text-2xl tracking-wider text-gray-900">{selectedReservation.pickupCode}</p>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  <p>Reservation ID: {selectedReservation.id}</p>
                  <p>Created: {new Date(selectedReservation.createdAt).toLocaleString()}</p>
                  {selectedReservation.plateNumber && <p>Vehicle: {selectedReservation.plateNumber}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
