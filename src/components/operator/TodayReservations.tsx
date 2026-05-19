// =====================================================
// TODAY'S RESERVATIONS - OPERATOR COMPONENT
// =====================================================
// View today's reservations grouped by time slot
// Quick verification and status updates
// =====================================================

import React, { useState, useEffect } from 'react';
import { Clock, User, Fuel, CheckCircle, AlertCircle, RefreshCw, Filter } from 'lucide-react';
import { stationService } from '../../lib/supabase/database';
import { reservationService } from '../../lib/supabase/database-advanced';
import { useAuth } from '../../contexts/AuthContext';
import { notifyError, notifySuccess } from '../../lib/utils/notifications';
import type { Reservation, Station } from '../../types/advanced';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export function TodayReservations() {
  const { user } = useAuth();
  const [station, setStation] = useState<Station | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('active');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get operator's station
      const stationData = await stationService.getOperatorStation(user.id);
      setStation(stationData);

      if (stationData) {
        // Get today's reservations
        const today = new Date().toISOString().split('T')[0];
        const data = await reservationService.getStationReservations(stationData.id, {
          date: today,
        });
        setReservations(data);
      }
    } catch (error) {
      notifyError('Failed to load reservations', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredReservations = () => {
    switch (activeFilter) {
      case 'pending':
        return reservations.filter((r) => r.status === 'confirmed');
      case 'active':
        return reservations.filter((r) => ['confirmed', 'arrived', 'dispensing'].includes(r.status));
      case 'completed':
        return reservations.filter((r) => r.status === 'completed');
      default:
        return reservations;
    }
  };

  const groupedReservations = getFilteredReservations().reduce((acc, res) => {
    const timeSlot = `${res.slot_start_time} - ${res.slot_end_time}`;
    if (!acc[timeSlot]) {
      acc[timeSlot] = [];
    }
    acc[timeSlot].push(res);
    return acc;
  }, {} as Record<string, Reservation[]>);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      confirmed: { label: 'Confirmed', className: 'bg-green-600' },
      arrived: { label: 'Arrived', className: 'bg-blue-600' },
      dispensing: { label: 'Dispensing', className: 'bg-purple-600' },
      completed: { label: 'Completed', className: 'bg-gray-600' },
      cancelled: { label: 'Cancelled', className: 'bg-red-600' },
    };
    const badge = badges[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'border-l-green-500';
      case 'arrived':
        return 'border-l-blue-500';
      case 'dispensing':
        return 'border-l-purple-500';
      case 'completed':
        return 'border-l-gray-500';
      default:
        return 'border-l-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (!station) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="size-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600">No station assigned to your account</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Today's Reservations</h2>
          <p className="text-gray-600">{station?.name}</p>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="size-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Total Today</p>
          <p className="text-2xl font-bold">{reservations.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-green-600">
            {reservations.filter((r) => r.status === 'confirmed').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">
            {reservations.filter((r) => ['arrived', 'dispensing'].includes(r.status)).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Completed</p>
          <p className="text-2xl font-bold text-gray-600">
            {reservations.filter((r) => r.status === 'completed').length}
          </p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Reservations Grouped by Time Slot */}
      {Object.keys(groupedReservations).length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="size-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Reservations</h3>
          <p className="text-gray-600">
            {activeFilter === 'active' && 'No active reservations at the moment.'}
            {activeFilter === 'pending' && 'No pending reservations.'}
            {activeFilter === 'completed' && 'No completed reservations yet.'}
            {activeFilter === 'all' && 'No reservations for today.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedReservations)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([timeSlot, slotReservations]) => (
              <Card key={timeSlot} className="p-4">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                  <Clock className="size-5 text-primary" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{timeSlot}</h3>
                    <p className="text-sm text-gray-600">
                      {slotReservations.length} reservation{slotReservations.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {slotReservations.map((reservation) => (
                    <Card
                      key={reservation.id}
                      className={`p-3 border-l-4 ${getStatusColor(reservation.status)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="size-4 text-gray-400" />
                            <span className="font-medium">{reservation.driver_name}</span>
                            {getStatusBadge(reservation.status)}
                          </div>
                          <p className="text-sm text-gray-600">
                            {reservation.driver_phone} • {reservation.driver_plate}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-semibold text-primary">
                            {reservation.pickup_code}
                          </p>
                          <p className="text-xs text-gray-500">Pickup Code</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm mb-3">
                        <div className="flex items-center gap-2">
                          <Fuel className="size-4 text-gray-400" />
                          <span>{reservation.fuel_type_name}</span>
                        </div>
                        <div>
                          <span className="font-medium">{reservation.quantity}L</span>
                        </div>
                        <div className="text-green-600 font-medium">
                          ETB {reservation.total_price.toFixed(2)}
                        </div>
                      </div>

                      {['confirmed', 'arrived', 'dispensing'].includes(reservation.status) && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() =>
                              (window.location.href = `/operator/verify?code=${reservation.pickup_code}`)
                            }
                          >
                            <CheckCircle className="size-4 mr-2" />
                            Quick Verify
                          </Button>
                        </div>
                      )}

                      {reservation.status === 'completed' && reservation.completed_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          Completed at {new Date(reservation.completed_at).toLocaleTimeString()}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
