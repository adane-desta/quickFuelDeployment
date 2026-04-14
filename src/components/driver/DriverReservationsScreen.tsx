import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reservationService } from '../../lib/supabase/database-advanced';
import { supabase } from '../../lib/supabase/client';
import { notifications, notifyError, notifySuccess } from '../../lib/utils/notifications';
import { Calendar, MapPin, Fuel, Clock, CheckCircle, XCircle, AlertCircle, X, Loader2, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

type DriverReservation = Awaited<ReturnType<typeof reservationService.getDriverReservations>>[number];

export function DriverReservationsScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'completed' | 'cancelled' | 'pending' | 'expired' | 'pending_refund' | 'refunded'>('all');
  const [reservations, setReservations] = useState<DriverReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<DriverReservation | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [requestingRefund, setRequestingRefund] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadReservations();
  }, [user]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const data = await reservationService.getDriverReservations(user.id);
      setReservations(data);
    } catch (error) {
      notifyError('Failed to load reservations', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRefund = async (reservationId: string) => {
    if (!confirm('Are you sure you want to request a refund? An 8% service fee will be deducted.')) return;
    setRequestingRefund(reservationId);
    try {
      const { error } = await supabase.functions.invoke('request-refund', {
        body: { reservationId },
      });
      if (error) throw error;
      notifySuccess('Refund request submitted. Awaiting approval.');
      await loadReservations();
    } catch (error) {
      notifyError('Failed to request refund', error);
    } finally {
      setRequestingRefund(null);
    }
  };

  const handleCancel = async (reservationId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    setCancelling(reservationId);
    try {
      const success = await reservationService.cancelReservation(reservationId, 'Cancelled by driver', user.id);
      if (success) {
        await loadReservations();
        notifications.reservation.cancelled();
      }
    } catch (error) {
      notifyError('Failed to cancel reservation', error);
    } finally {
      setCancelling(null);
    }
  };

  const handleCopyPickupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    notifySuccess('Pickup code copied to clipboard!');
  };

  const filteredReservations = reservations.filter(r => filter === 'all' || r.status === filter);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed': return { color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle, label: 'Confirmed' };
      case 'completed': return { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: CheckCircle, label: 'Completed' };
      case 'cancelled': return { color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle, label: 'Cancelled' };
      case 'pending': return { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: AlertCircle, label: 'Pending' };
      case 'expired': return { color: 'bg-orange-100 text-orange-700 border-orange-300', icon: AlertCircle, label: 'Expired' };
      case 'pending_refund': return { color: 'bg-purple-100 text-purple-700 border-purple-300', icon: AlertCircle, label: 'Pending Refund' };
      case 'refunded': return { color: 'bg-gray-100 text-gray-700 border-gray-300', icon: CheckCircle, label: 'Refunded' };
      default: return { color: 'bg-gray-100 text-gray-700 border-gray-300', icon: AlertCircle, label: status };
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 lg:px-6 py-6 shadow-md">
        <h1 className="text-white mb-2">My Reservations</h1>
        <p className="text-blue-100 text-sm">View and manage your fuel reservations</p>
      </div>

      <div className="bg-white px-4 lg:px-6 py-3 border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'confirmed', 'pending', 'completed', 'expired', 'pending_refund', 'refunded', 'cancelled'] as const).map(f => {
            const count = reservations.filter(r => r.status === f).length;
            const colors: Record<string, string> = {
              all: 'bg-blue-600', confirmed: 'bg-green-600', pending: 'bg-yellow-600', completed: 'bg-blue-600',
              expired: 'bg-orange-600', pending_refund: 'bg-purple-600', refunded: 'bg-gray-600', cancelled: 'bg-red-600'
            };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  filter === f ? `${colors[f]} text-white` : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')} ({count})
              </button>
            );
          })}
        </div>
      </div>

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
              const isExpired = reservation.status === 'expired';
              const canRefund = isExpired && !reservation.refund_requested_at;

              return (
                <div key={reservation.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-gray-900 mb-1">{reservation.station_name}</h3>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{reservation.station_address || 'N/A'}</span>
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
                        <p className="text-sm text-gray-900">{formatDate(reservation.slot_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Time Slot</p>
                        <p className="text-sm text-gray-900">{reservation.slot_start_time} – {reservation.slot_end_time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Fuel</p>
                        <p className="text-sm text-gray-900">{reservation.fuel_type_name} - {reservation.quantity}L</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Cost</p>
                      <p className="text-sm text-gray-900">ETB {reservation.total_price.toLocaleString()}</p>
                    </div>
                    {reservation.expires_at && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Expires at</p>
                        <p className="text-sm text-red-600">{new Date(reservation.expires_at).toLocaleString()}</p>
                      </div>
                    )}
                    {reservation.refund_amount && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Refund Amount (after 8% fee)</p>
                        <p className="text-sm text-green-600">ETB {reservation.refund_amount.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Pickup Code */}
                  {['confirmed', 'arrived', 'dispensing'].includes(reservation.status) && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200 mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Pickup Code</p>
                          <p className="text-xl tracking-wider text-gray-900">{reservation.pickup_code}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleCopyPickupCode(reservation.pickup_code)} className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700">Copy</button>
                          <button onClick={() => setShowQR(reservation.id)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Show QR</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {reservation.status === 'confirmed' && (
                      <>
                        <button onClick={() => setSelectedReservation(reservation)} className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">View Details</button>
                        <button onClick={() => handleCancel(reservation.id)} disabled={cancelling === reservation.id} className="py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60">
                          {cancelling === reservation.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel'}
                        </button>
                      </>
                    )}
                    {reservation.status === 'completed' && (
                      <button onClick={() => setSelectedReservation(reservation)} className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">View Receipt</button>
                    )}
                    {reservation.status === 'expired' && (
                      <button onClick={() => handleRequestRefund(reservation.id)} disabled={requestingRefund === reservation.id} className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60">
                        {requestingRefund === reservation.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Request Refund'}
                      </button>
                    )}
                    {reservation.status === 'pending' && (
                      <button className="w-full py-2 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">Complete Payment</button>
                    )}
                    {(reservation.status === 'cancelled' || reservation.status === 'refunded') && (
                      <button className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Book Again</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Code Modal (unchanged) */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">QR Code</h3>
              <button onClick={() => setShowQR(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            {(() => {
              const r = reservations.find(x => x.id === showQR);
              if (!r) return null;
              return (
                <div className="text-center">
                  <div className="bg-white rounded-lg p-4 inline-block mb-4 border-2 border-gray-200">
                    <QRCodeSVG value={r.qr_code || r.pickup_code} size={200} />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Pickup Code</p>
                  <p className="text-2xl tracking-wider text-gray-900 mb-2">{r.pickup_code}</p>
                  <p className="text-xs text-gray-500">Show this code at {r.station_name}</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Detail Modal (simplified) */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900">Reservation Details</h3>
                <button onClick={() => setSelectedReservation(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Station</p>
                  <p className="text-gray-900">{selectedReservation.station_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-600 mb-1">Date</p><p className="text-gray-900">{formatDate(selectedReservation.slot_date)}</p></div>
                  <div><p className="text-sm text-gray-600 mb-1">Time</p><p className="text-gray-900">{selectedReservation.slot_start_time} – {selectedReservation.slot_end_time}</p></div>
                  <div><p className="text-sm text-gray-600 mb-1">Fuel Type</p><p className="text-gray-900">{selectedReservation.fuel_type_name}</p></div>
                  <div><p className="text-sm text-gray-600 mb-1">Quantity</p><p className="text-gray-900">{selectedReservation.quantity}L</p></div>
                  <div><p className="text-sm text-gray-600 mb-1">Total Cost</p><p className="text-gray-900">ETB {selectedReservation.total_price.toLocaleString()}</p></div>
                  <div><p className="text-sm text-gray-600 mb-1">Payment</p><p className="text-gray-900">{selectedReservation.payment_method}</p></div>
                </div>
                {selectedReservation.expires_at && (
                  <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <p className="text-sm text-gray-600 mb-1">Expires at</p>
                    <p className="text-gray-900">{new Date(selectedReservation.expires_at).toLocaleString()}</p>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  <p>Reservation ID: {selectedReservation.id}</p>
                  <p>Created: {new Date(selectedReservation.created_at).toLocaleString()}</p>
                  {selectedReservation.driver_plate && <p>Vehicle: {selectedReservation.driver_plate}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}