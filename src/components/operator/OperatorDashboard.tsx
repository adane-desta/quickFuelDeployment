import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { stationService, inventoryService } from '../../lib/supabase/database';
import { reservationService, analyticsService } from '../../lib/supabase/database-advanced';
import { notifyError, notifySuccess } from '../../lib/utils/notifications';
import type { Station, Reservation, StationFuelInventory } from '../../types/advanced';
import {
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Fuel,
  TrendingUp,
  Droplets,
  QrCode,
  AlertCircle,
  Activity,
  RefreshCw,
  Eye,
  MapPin,
  Phone,
  Clock3,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Timer,
  DollarSign,
  Gauge,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';

interface DashboardStats {
  today_total: number;
  today_completed: number;
  today_pending: number;
  today_cancelled: number;
  active_now: number;
  total_fuel_dispensed: number;
  total_revenue: number;
}

interface OperatorDashboardProps {
  onNavigate: (tab: string) => void;
}

export function OperatorDashboard({ onNavigate }: OperatorDashboardProps) {
  const { user } = useAuth();
  const [station, setStation] = useState<Station | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayReservations, setTodayReservations] = useState<Reservation[]>([]);
  const [inventory, setInventory] = useState<StationFuelInventory[]>([]);
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
      // Get operator's station
      const stationData = await stationService.getOperatorStation(user.id);
      
      if (!stationData) {
        setLoading(false);
        return;
      }

      setStation(stationData);

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Load all data in parallel
      const [reservationsData, inventoryData] = await Promise.all([
        reservationService.getStationReservations(stationData.id, { date: today }),
        inventoryService.getStationInventory(stationData.id),
      ]);

      setTodayReservations(reservationsData);
      setInventory(inventoryData);

      // Calculate stats from reservations
      const statsData: DashboardStats = {
        today_total: reservationsData.length,
        today_completed: reservationsData.filter((r) => r.status === 'completed').length,
        today_pending: reservationsData.filter((r) => r.status === 'confirmed').length,
        today_cancelled: reservationsData.filter((r) => r.status === 'cancelled').length,
        active_now: reservationsData.filter((r) => r.status === 'dispensing').length,
        total_fuel_dispensed: reservationsData
          .filter((r) => r.status === 'completed')
          .reduce((sum, r) => sum + (r.quantity || 0), 0),
        total_revenue: reservationsData
          .filter((r) => r.status === 'completed')
          .reduce((sum, r) => sum + (r.total_price || 0), 0),
      };

      setStats(statsData);
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

  const getReservationStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600';
      case 'dispensing':
        return 'bg-blue-600';
      case 'arrived':
        return 'bg-orange-600';
      case 'confirmed':
        return 'bg-yellow-600';
      case 'cancelled':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getReservationStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="size-4" />;
      case 'dispensing':
        return <Droplets className="size-4" />;
      case 'arrived':
        return <Clock className="size-4" />;
      case 'confirmed':
        return <Calendar className="size-4" />;
      case 'cancelled':
        return <XCircle className="size-4" />;
      default:
        return <Activity className="size-4" />;
    }
  };

  const getStockPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
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
            <AlertCircle className="size-20 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-2xl font-bold mb-2">No Station Assigned</h3>
            <p className="text-gray-600 mb-4">
              You don't have a station assigned to your account yet.
            </p>
            <p className="text-sm text-gray-500">
              Please contact your station owner to assign you to a station.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const confirmedCount = stats?.today_pending || 0;
  const completedCount = stats?.today_completed || 0;
  const activeCount = stats?.active_now || 0;
  const lowStockCount = inventory.filter((inv) => inv.stock_status === 'low').length;

  // Get next reservations in queue
  const nextInQueue = todayReservations
    .filter((r) => r.status === 'confirmed' || r.status === 'arrived')
    .sort((a, b) => {
      if (a.status === 'arrived' && b.status !== 'arrived') return -1;
      if (a.status !== 'arrived' && b.status === 'arrived') return 1;
      return (a.slot_start_time || '').localeCompare(b.slot_start_time || '');
    })
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-1">Operator Dashboard</h1>
              <p className="text-green-100 text-sm md:text-base">Welcome back, {user?.fullName}</p>
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Fuel className="size-4 text-green-200" />
              <span className="text-green-100 truncate font-medium">{station.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-green-200" />
              <span className="text-green-100 truncate">{station.address.split(',')[0]}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock3 className="size-4 text-green-200" />
              <span className="text-green-100">
                {station.is_24_hours ? '24/7' : `${station.opening_time}-${station.closing_time}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Critical Alerts */}
        {(lowStockCount > 0 || activeCount > 0) && (
          <div className="space-y-3">
            {activeCount > 0 && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-3">
                  <Activity className="size-6 text-blue-600 flex-shrink-0 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-blue-900">Active Reservations</p>
                    <p className="text-sm text-blue-800">
                      {activeCount} customer{activeCount !== 1 ? 's are' : ' is'} currently being served.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onNavigate('reservations')}
                    className="flex-shrink-0"
                  >
                    View All
                  </Button>
                </div>
              </Card>
            )}
            {lowStockCount > 0 && (
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="size-6 text-yellow-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-yellow-900">Low Fuel Stock</p>
                    <p className="text-sm text-yellow-800">
                      {lowStockCount} fuel type{lowStockCount !== 1 ? 's are' : ' is'} running low.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('fuel')}
                    className="flex-shrink-0"
                  >
                    Check Inventory
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Today's Total */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Calendar className="size-10 text-blue-600" />
              <TrendingUp className="size-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats?.today_total || 0}</p>
            <p className="text-sm text-gray-600">Today's Reservations</p>
            <p className="text-xs text-gray-500 mt-1">Total bookings</p>
          </Card>

          {/* In Queue */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Users className="size-10 text-yellow-600" />
              {confirmedCount > 0 && (
                <Badge className="bg-yellow-600">{confirmedCount}</Badge>
              )}
            </div>
            <p className="text-3xl font-bold mb-1">{confirmedCount}</p>
            <p className="text-sm text-gray-600">In Queue</p>
            <p className="text-xs text-gray-500 mt-1">Waiting customers</p>
          </Card>

          {/* Active/Dispensing */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Droplets className="size-10 text-orange-600" />
              {activeCount > 0 && (
                <Badge className="bg-orange-600 animate-pulse">{activeCount}</Badge>
              )}
            </div>
            <p className="text-3xl font-bold mb-1">{activeCount}</p>
            <p className="text-sm text-gray-600">Active Now</p>
            <p className="text-xs text-gray-500 mt-1">Being served</p>
          </Card>

          {/* Completed */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle className="size-10 text-green-600" />
              <TrendingUp className="size-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold mb-1">{completedCount}</p>
            <p className="text-sm text-gray-600">Completed Today</p>
            <p className="text-xs text-green-600 mt-1">
              {stats?.today_total ? Math.round((completedCount / stats.today_total) * 100) : 0}% success
            </p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-blue-600 to-blue-700 text-white"
            onClick={() => onNavigate('verify')}
          >
            <QrCode className="size-12 mb-3" />
            <h3 className="font-semibold text-lg mb-1">Verify Pickup Code</h3>
            <p className="text-blue-100 text-sm">Scan or enter 6-digit code</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-medium">Quick Action</span>
              <ArrowRight className="size-5" />
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate('reservations')}
          >
            <Calendar className="size-12 text-blue-600 mb-3" />
            <h3 className="font-semibold text-lg mb-1">View Reservations</h3>
            <p className="text-gray-600 text-sm">Today's schedule and bookings</p>
            <div className="mt-4 pt-3 border-t">
              <p className="text-xs font-medium text-gray-700">
                {stats?.today_total || 0} reservations today
              </p>
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate('fuel')}
          >
            <Fuel className="size-12 text-green-600 mb-3" />
            <h3 className="font-semibold text-lg mb-1">Fuel Management</h3>
            <p className="text-gray-600 text-sm">View inventory status</p>
            <div className="mt-4 pt-3 border-t">
              <p className="text-xs font-medium text-gray-700">
                {inventory.length} fuel types available
              </p>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Next in Queue */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                <h3 className="font-semibold text-lg">Next in Queue</h3>
              </div>
              <Badge className="bg-yellow-600">
                {nextInQueue.length} waiting
              </Badge>
            </div>

            {nextInQueue.length === 0 ? (
              <div className="text-center py-8">
                <Users className="size-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 mb-2">No customers in queue</p>
                <p className="text-sm text-gray-500">Waiting for new reservations</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {nextInQueue.map((reservation, index) => (
                  <div
                    key={reservation.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      reservation.status === 'arrived'
                        ? 'bg-orange-50 border-orange-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{reservation.driver_name}</p>
                          <p className="text-sm text-gray-600">{reservation.driver_phone}</p>
                        </div>
                      </div>
                      <Badge className={getReservationStatusColor(reservation.status)}>
                        {reservation.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <Fuel className="size-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Fuel Type</p>
                          <p className="font-medium">{reservation.fuel_type_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplets className="size-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Quantity</p>
                          <p className="font-medium">{reservation.quantity}L</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Time Slot</p>
                          <p className="font-medium">{reservation.slot_start_time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="size-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Amount</p>
                          <p className="font-medium text-green-600">
                            ETB {reservation.total_price?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-2 text-gray-500">
                        <QrCode className="size-4" />
                        <span className="text-sm">
                          Code ready for verification
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onNavigate('verify')}
                      >
                        Verify Code
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

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
                onClick={() => onNavigate('fuel')}
              >
                View Details
              </Button>
            </div>

            {inventory.length === 0 ? (
              <div className="text-center py-8">
                <Fuel className="size-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">No fuel inventory data</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {inventory.map((item) => {
                  const percentage = getStockPercentage(item.current_stock, item.maximum_capacity);

                  return (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.fuel_type_name}</p>
                          <p className="text-xs text-gray-500">{item.fuel_type_code}</p>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={
                              item.stock_status === 'low'
                                ? 'bg-red-600'
                                : item.stock_status === 'moderate'
                                ? 'bg-yellow-600'
                                : 'bg-green-600'
                            }
                          >
                            {item.stock_status?.toUpperCase()}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.current_stock.toLocaleString()}L
                          </p>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{percentage.toFixed(0)}% capacity</span>
                        <span>Max: {item.maximum_capacity.toLocaleString()}L</span>
                      </div>
                      {item.stock_status === 'low' && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                          <AlertTriangle className="size-4 text-red-600" />
                          <span className="text-xs text-red-700 font-medium">
                            Below minimum threshold
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
        </div>

        {/* Today's Summary */}
        {stats && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="size-5 text-primary" />
              <h3 className="font-semibold text-lg">Today's Performance</h3>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="size-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-600">{stats.today_completed}</p>
                <p className="text-sm text-gray-600 mt-1">Completed</p>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Droplets className="size-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{stats.total_fuel_dispensed.toLocaleString()}L</p>
                <p className="text-sm text-gray-600 mt-1">Fuel Dispensed</p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <DollarSign className="size-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold text-purple-600">
                  {stats.total_revenue.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-1">Revenue (ETB)</p>
              </div>

              <div className="text-center p-4 bg-red-50 rounded-lg">
                <XCircle className="size-8 mx-auto mb-2 text-red-600" />
                <p className="text-2xl font-bold text-red-600">{stats.today_cancelled}</p>
                <p className="text-sm text-gray-600 mt-1">Cancelled</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}