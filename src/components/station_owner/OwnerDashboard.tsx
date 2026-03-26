// =====================================================
// STATION OWNER DASHBOARD - COMPLETE & COMPREHENSIVE
// =====================================================
// Full-featured dashboard with all owner functionalities
// Mobile-first design with detailed analytics and controls
// =====================================================

import React, { useState, useEffect } from 'react';
import {
  Fuel,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Package,
  DollarSign,
  Activity,
  Calendar,
  BarChart3,
  Truck,
  Settings,
  AlertCircle,
  Building2,
  Eye,
  RefreshCw,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Phone,
  Clock3,
  Shield,
  Star,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { stationService, inventoryService, userService } from '../../lib/supabase/database';
import { analyticsService, deliveryService, reservationService } from '../../lib/supabase/database-advanced';
import { notifyError, notifySuccess } from '../../lib/utils/notifications';
import type { Station, StationFuelInventory, FuelDelivery, User as UserType, Reservation } from '../../types/advanced';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';

interface DashboardStats {
  today_revenue: number;
  today_reservations: number;
  today_completed: number;
  active_reservations: number;
  total_revenue: number;
  total_reservations: number;
  average_rating: number;
  total_reviews: number;
}

interface OwnerDashboardProps {
  onNavigate?: (tab: string) => void;
}

export function OwnerDashboard({ onNavigate }: OwnerDashboardProps) {
  const { user } = useAuth();
  const [station, setStation] = useState<Station | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inventory, setInventory] = useState<StationFuelInventory[]>([]);
  const [operators, setOperators] = useState<UserType[]>([]);
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [pendingDeliveries, setPendingDeliveries] = useState<FuelDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get owner's station
      const stationsData = await stationService.getOwnerStations(user.id);
      
      if (stationsData.length === 0) {
        setLoading(false);
        return;
      }

      const ownerStation = stationsData[0];
      setStation(ownerStation);

      // Load all dashboard data in parallel
      const [
        inventoryData,
        operatorsData,
        reservationsData,
        deliveriesData,
        dashboardData,
      ] = await Promise.all([
        inventoryService.getStationInventory(ownerStation.id),
        userService.getStationOperators(ownerStation.id),
        reservationService.getStationReservations(ownerStation.id, {}),
        deliveryService.getStationDeliveries(ownerStation.id),
        analyticsService.getStationDashboard(ownerStation.id),
      ]);

      setInventory(inventoryData);
      setOperators(operatorsData);
      setRecentReservations(reservationsData);
      setPendingDeliveries(deliveriesData.filter((d) => d.status === 'pending'));
      setStats(dashboardData as DashboardStats);
    } catch (error) {
      notifyError('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    notifySuccess('Dashboard refreshed');
  };

  const getStockPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const getStockColor = (percentage: number) => {
    if (percentage < 25) return 'bg-red-600';
    if (percentage < 50) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const getReservationStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600';
      case 'confirmed':
        return 'bg-blue-600';
      case 'pending':
        return 'bg-yellow-600';
      case 'cancelled':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-32" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <Building2 className="size-20 mx-auto mb-4 text-gray-400" />
            <h3 className="text-2xl font-bold mb-2">No Station Assigned</h3>
            <p className="text-gray-600 mb-4">
              You don't have any stations assigned to your account yet.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Please contact the system administrator to assign a station to your account.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const lowStockCount = inventory.filter((inv) => inv.stock_status === 'low').length;
  const activeOperators = operators.filter((op) => op.operator_status === 'active').length;
  const todayRevenue = stats?.today_revenue || 0;
  const todayReservations = stats?.today_reservations || 0;
  const todayCompleted = stats?.today_completed || 0;
  const activeReservations = stats?.active_reservations || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-1">{station.name}</h1>
              <p className="text-orange-100 text-sm md:text-base">Station Owner Dashboard</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Station Quick Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-orange-200" />
              <span className="text-orange-100 truncate">{station.address.split(',')[0]}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-orange-200" />
              <span className="text-orange-100">{station.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock3 className="size-4 text-orange-200" />
              <span className="text-orange-100">
                {station.is_24_hours ? '24/7' : `${station.opening_time}-${station.closing_time}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-orange-200" />
              <Badge className="bg-white text-orange-600">
                {station.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Critical Alerts */}
        {(lowStockCount > 0 || pendingDeliveries.length > 0) && (
          <div className="space-y-3">
            {lowStockCount > 0 && (
              <Card className="p-4 bg-red-50 border-red-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="size-6 text-red-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-red-900">Critical: Low Fuel Stock!</p>
                    <p className="text-sm text-red-800">
                      {lowStockCount} fuel type{lowStockCount !== 1 ? 's are' : ' is'} running critically low.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onNavigate?.('deliveries')}
                    className="flex-shrink-0"
                  >
                    Request Delivery
                  </Button>
                </div>
              </Card>
            )}
            {pendingDeliveries.length > 0 && (
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <div className="flex items-center gap-3">
                  <Truck className="size-6 text-yellow-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-yellow-900">Pending Deliveries</p>
                    <p className="text-sm text-yellow-800">
                      {pendingDeliveries.length} delivery request{pendingDeliveries.length !== 1 ? 's' : ''} awaiting admin approval.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate?.('deliveries')}
                    className="flex-shrink-0"
                  >
                    View Status
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Today's Revenue */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="size-10 text-green-600" />
              <TrendingUp className="size-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600 mb-1">
              {todayRevenue.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Today's Revenue</p>
            <p className="text-xs text-gray-500 mt-1">ETB</p>
          </Card>

          {/* Today's Reservations */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Calendar className="size-10 text-blue-600" />
              <Badge className="bg-blue-600">{todayCompleted}/{todayReservations}</Badge>
            </div>
            <p className="text-3xl font-bold mb-1">{todayReservations}</p>
            <p className="text-sm text-gray-600">Today's Bookings</p>
            <p className="text-xs text-green-600 mt-1">{todayCompleted} completed</p>
          </Card>

          {/* Active Reservations */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Activity className="size-10 text-orange-600" />
              {activeReservations > 0 && (
                <Badge className="bg-orange-600 animate-pulse">{activeReservations}</Badge>
              )}
            </div>
            <p className="text-3xl font-bold mb-1">{activeReservations}</p>
            <p className="text-sm text-gray-600">Active Now</p>
            <p className="text-xs text-gray-500 mt-1">In progress</p>
          </Card>

          {/* Operators */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Users className="size-10 text-purple-600" />
              <TrendingUp className="size-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold mb-1">{activeOperators}</p>
            <p className="text-sm text-gray-600">Active Operators</p>
            <p className="text-xs text-gray-500 mt-1">of {operators.length} total</p>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Fuel Inventory Status */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Fuel className="size-5 text-primary" />
                <h3 className="font-semibold text-lg">Fuel Inventory</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate?.('deliveries')}
              >
                Request Fuel
              </Button>
            </div>

            {inventory.length === 0 ? (
              <div className="text-center py-8">
                <Fuel className="size-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">No fuel types configured</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inventory.map((item) => {
                  const percentage = getStockPercentage(item.current_stock, item.maximum_capacity);
                  const colorClass = getStockColor(percentage);

                  return (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.fuel_type_name}</p>
                          <p className="text-xs text-gray-500">{item.fuel_type_code}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">ETB {item.effective_price?.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">{item.current_stock.toLocaleString()}L</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Progress value={percentage} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{percentage.toFixed(0)}% full</span>
                          <span>Max: {item.maximum_capacity.toLocaleString()}L</span>
                        </div>
                      </div>
                      {item.stock_status === 'low' && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                          <AlertTriangle className="size-4 text-red-600" />
                          <span className="text-xs text-red-700 font-medium">
                            Below minimum threshold ({item.minimum_stock_threshold}L)
                          </span>
                        </div>
                      )}
                      <Separator />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Recent Reservations */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="size-5 text-primary" />
                <h3 className="font-semibold text-lg">Recent Reservations</h3>
              </div>
              <Button variant="ghost" size="sm">
                <Eye className="size-4" />
              </Button>
            </div>

            {recentReservations.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="size-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">No recent reservations</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recentReservations.slice(0, 8).map((reservation) => (
                  <div
                    key={reservation.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{reservation.driver_name}</p>
                        <p className="text-sm text-gray-600">{reservation.fuel_type_name}</p>
                      </div>
                      <Badge className={getReservationStatusColor(reservation.status)}>
                        {reservation.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Fuel className="size-3" />
                        <span>{reservation.quantity}L</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="size-3" />
                        <span>{reservation.time_slot}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Operators & Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Operators Status */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                <h3 className="font-semibold text-lg">Station Operators</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate?.('operators')}
              >
                Manage
              </Button>
            </div>

            {operators.length === 0 ? (
              <div className="text-center py-8">
                <Users className="size-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 mb-3">No operators assigned</p>
                <Button size="sm" onClick={() => onNavigate?.('operators')}>
                  Add Operator
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {operators.slice(0, 5).map((operator) => (
                  <div
                    key={operator.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                        <Users className="size-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{operator.full_name}</p>
                        <p className="text-xs text-gray-500">{operator.email}</p>
                      </div>
                    </div>
                    <Badge
                      className={
                        operator.operator_status === 'active'
                          ? 'bg-green-600'
                          : operator.operator_status === 'blocked'
                          ? 'bg-red-600'
                          : 'bg-gray-500'
                      }
                    >
                      {operator.operator_status}
                    </Badge>
                  </div>
                ))}
                {operators.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => onNavigate?.('operators')}
                  >
                    View all {operators.length} operators
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-5">
            <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => onNavigate?.('operators')}
              >
                <Users className="size-8 text-blue-600" />
                <span className="text-sm">Manage Operators</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => onNavigate?.('deliveries')}
              >
                <Truck className="size-8 text-purple-600" />
                <span className="text-sm">Request Fuel</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => onNavigate?.('settings')}
              >
                <Settings className="size-8 text-gray-600" />
                <span className="text-sm">Station Settings</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
              >
                <BarChart3 className="size-8 text-orange-600" />
                <span className="text-sm">View Analytics</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Performance Overview */}
{stats && (
  <Card className="p-5">
    <div className="flex items-center gap-2 mb-4">
      <TrendingUp className="size-5 text-primary" />
      <h3 className="font-semibold text-lg">Station Performance</h3>
    </div>

    <div className="grid md:grid-cols-4 gap-4">
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-2xl font-bold text-green-600">
          ETB {stats.total_revenue?.toLocaleString() ?? '0'}
        </p>
        <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
      </div>

      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-2xl font-bold">{stats.total_reservations ?? 0}</p>
        <p className="text-sm text-gray-600 mt-1">Total Reservations</p>
      </div>

      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Star className="size-5 text-yellow-500 fill-yellow-500" />
          <p className="text-2xl font-bold">{(stats.average_rating ?? 0).toFixed(1)}</p>
        </div>
        <p className="text-sm text-gray-600 mt-1">Average Rating</p>
      </div>

      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-2xl font-bold text-blue-600">{stats.total_reviews ?? 0}</p>
        <p className="text-sm text-gray-600 mt-1">Customer Reviews</p>
      </div>
    </div>
  </Card>
)}
      </div>
    </div>
  );
}