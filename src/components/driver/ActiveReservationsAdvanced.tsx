// =====================================================
// ACTIVE RESERVATIONS - DRIVER COMPONENT
// =====================================================
// View all reservations with real-time data from database
// Filter, cancel, and view pickup codes
// =====================================================

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Fuel,
  MapPin,
  QrCode,
  XCircle,
  CheckCircle,
  AlertCircle,
  Navigation,
  Copy,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { reservationService } from '../../lib/supabase/database-advanced';
import { notifications, notifyError, notifySuccess } from '../../lib/utils/notifications';
import type { Reservation } from '../../types/advanced';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export function ActiveReservationsAdvanced() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('active');

  useEffect(() => {
    if (user) {
      loadReservations();
    }
  }, [user]);

  const loadReservations = async () => {
    if (!user) return;

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

  const handleCancelReservation = async (reservationId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to cancel this reservation?')) return;

    try {
      const success = await reservationService.cancelReservation(
        reservationId,
        'Cancelled by driver',
        user.id
      );

      if (success) {
        notifications.reservation.cancelled();
        loadReservations();
      }
    } catch (error) {
      notifyError('Failed to cancel reservation', error);
    }
  };

  const handleCopyPickupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    notifySuccess('Pickup code copied!');
  };

  const handleNavigateToStation = (latitude: number, longitude: number) => {
    // Open Google Maps with directions
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending Payment', className: 'bg-yellow-500' },
      confirmed: { label: 'Confirmed', className: 'bg-green-600' },
      arrived: { label: 'Arrived', className: 'bg-blue-600' },
      dispensing: { label: 'Dispensing', className: 'bg-purple-600' },
      completed: { label: 'Completed', className: 'bg-gray-600' },
      cancelled: { label: 'Cancelled', className: 'bg-red-600' },
      expired: { label: 'Expired', className: 'bg-orange-600' },
    };

    const badge = badges[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  const getFilteredReservations = () => {
    switch (activeFilter) {
      case 'active':
        return reservations.filter((r) => ['pending', 'confirmed', 'arrived', 'dispensing'].includes(r.status));
      case 'completed':
        return reservations.filter((r) => r.status === 'completed');
      case 'cancelled':
        return reservations.filter((r) => ['cancelled', 'expired'].includes(r.status));
      default:
        return reservations;
    }
  };

  const filteredReservations = getFilteredReservations();

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">My Reservations</h2>
        <p className="text-gray-600">View and manage your fuel reservations</p>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">
            Active ({reservations.filter((r) => r.is_active).length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({reservations.filter((r) => r.status === 'completed').length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({reservations.filter((r) => ['cancelled', 'expired'].includes(r.status)).length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({reservations.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Reservations List */}
      {filteredReservations.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertCircle className="size-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Reservations</h3>
          <p className="text-gray-600 mb-4">
            {activeFilter === 'active' && "You don't have any active reservations."}
            {activeFilter === 'completed' && "You haven't completed any reservations yet."}
            {activeFilter === 'cancelled' && "No cancelled reservations."}
            {activeFilter === 'all' && "You haven't made any reservations yet."}
          </p>
          <Button onClick={() => window.location.href = '/driver'}>
            Make a Reservation
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => (
            <Card key={reservation.id} className="p-4 hover:shadow-lg transition-shadow">
              {/* Status & Station */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{reservation.station_name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="size-4" />
                    <span>View on map</span>
                  </div>
                </div>
                {getStatusBadge(reservation.status)}
              </div>

              {/* Reservation Details */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Date & Time */}
                <div className="flex items-start gap-3">
                  <Calendar className="size-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium">
                      {reservation.slot_date && new Date(reservation.slot_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {reservation.slot_start_time} - {reservation.slot_end_time}
                    </p>
                  </div>
                </div>

                {/* Fuel Details */}
                <div className="flex items-start gap-3">
                  <Fuel className="size-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Fuel Details</p>
                    <p className="font-medium">{reservation.fuel_type_name}</p>
                    <p className="text-sm text-gray-600">{reservation.quantity}L</p>
                  </div>
                </div>
              </div>

              {/* Pickup Code (for confirmed/active reservations) */}
              {['confirmed', 'arrived', 'dispensing'].includes(reservation.status) && (
                <Card className="p-4 bg-primary/5 border-primary/20 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Pickup Code</p>
                      <div className="flex items-center gap-3">
                        <p className="text-3xl font-bold font-mono tracking-wider text-primary">
                          {reservation.pickup_code}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyPickupCode(reservation.pickup_code)}
                        >
                          <Copy className="size-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Show this code at the station
                      </p>
                    </div>
                    <QrCode className="size-16 text-primary" />
                  </div>
                </Card>
              )}

              {/* Price */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
                <span className="text-sm text-gray-600">Total Amount</span>
                <span className="text-xl font-bold text-green-600">
                  ETB {reservation.total_price.toFixed(2)}
                </span>
              </div>

              {/* Expiration Warning */}
              {reservation.status === 'confirmed' && reservation.expires_at && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                  <Clock className="size-4 text-amber-600" />
                  <p className="text-sm text-amber-700">
                    Arrives before {new Date(reservation.expires_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })} or reservation will expire
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {reservation.can_cancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleCancelReservation(reservation.id)}
                  >
                    <XCircle className="size-4 mr-2" />
                    Cancel
                  </Button>
                )}

                {['confirmed', 'arrived'].includes(reservation.status) && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // Would navigate to station with lat/lng
                      notifySuccess('Opening navigation...');
                    }}
                  >
                    <Navigation className="size-4 mr-2" />
                    Navigate
                  </Button>
                )}

                {reservation.status === 'completed' && (
                  <Button variant="outline" size="sm" className="flex-1">
                    <CheckCircle className="size-4 mr-2" />
                    Leave Review
                  </Button>
                )}
              </div>

              {/* Completed/Cancelled Info */}
              {reservation.completed_at && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Completed on {new Date(reservation.completed_at).toLocaleString()}
                </p>
              )}
              {reservation.cancelled_at && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Cancelled on {new Date(reservation.cancelled_at).toLocaleString()}
                  {reservation.cancellation_reason && ` - ${reservation.cancellation_reason}`}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
