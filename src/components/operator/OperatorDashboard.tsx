import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { stationService, inventoryService } from '../../lib/supabase/database';
import { reservationService } from '../../lib/supabase/database-advanced';
import { supabase } from '../../lib/supabase/client';
import { notifyError, notifySuccess } from '../../lib/utils/notifications';
import type { Station, Reservation, StationFuelInventory } from '../../types/advanced';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Skeleton } from '../ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Fuel,
  TrendingUp,
  Droplet,
  QrCode,
  AlertCircle,
  Activity,
  RefreshCw,
  MapPin,
  Phone,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  DollarSign,
  Car,
  Truck,
  Ambulance,
  Bell,
} from 'lucide-react';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';

type DateRange = 'today' | 'week' | 'month';

interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
  expired: number;
  active_now: number;
  total_fuel_dispensed: number;
  total_revenue: number;
}

const getCarClassPriority = (className: string): number => {
  if (className === 'Ambulance') return 1;
  if (className === 'Agricultural') return 2;
  return 3;
};

const getPriorityIcon = (className: string) => {
  if (className === 'Ambulance') return <Ambulance className="size-4 text-red-600" />;
  if (className === 'Agricultural') return <Truck className="size-4 text-green-600" />;
  return <Car className="size-4 text-gray-500" />;
};

export function OperatorDashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { user } = useAuth();
  const [station, setStation] = useState<Station | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [inventory, setInventory] = useState<StationFuelInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [nextInQueue, setNextInQueue] = useState<Reservation[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [stationId, setStationId] = useState<string | null>(null);

  // Load data
  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const stationData = await stationService.getOperatorStation(user.id);
      if (!stationData) { setLoading(false); return; }
      setStation(stationData);
      setStationId(stationData.id);

      const { start, end } = getDateRangeFilter();
      const [reservationsData, inventoryData] = await Promise.all([
        reservationService.getStationReservations(stationData.id, {}),
        inventoryService.getStationInventory(stationData.id),
      ]);

      const filtered = reservationsData.filter(r => r.slot_date >= start && r.slot_date <= end);
      setReservations(filtered);
      setInventory(inventoryData);

      const todayStr = new Date().toISOString().split('T')[0];
      const todayConfirmed = filtered.filter(r => r.status === 'confirmed' && r.slot_date === todayStr);

      const driverIds = todayConfirmed.map(r => r.driver_id);
      let driverDetailsMap = new Map();
      if (driverIds.length) {
        const { data: drivers } = await supabase.from('users').select('id, plate_number, car_class_id').in('id', driverIds);
        if (drivers) {
          const carClassIds = drivers.map(d => d.car_class_id).filter(Boolean);
          const { data: carClasses } = await supabase.from('car_classes').select('id, name').in('id', carClassIds);
          const carClassNameMap = new Map(carClasses?.map(cc => [cc.id, cc?.name]) || []);
          drivers.forEach(driver => {
            const className = carClassNameMap.get(driver.car_class_id) || 'Regular';
            driverDetailsMap.set(driver.id, {
              plate_number: driver.plate_number || null,
              car_class: className,
              priority: getCarClassPriority(className),
            });
          });
        }
      }

      const enriched = todayConfirmed.map(res => ({
        ...res,
        driver_plate: driverDetailsMap.get(res.driver_id)?.plate_number || null,
        car_class: driverDetailsMap.get(res.driver_id)?.car_class || 'Regular',
        priority: driverDetailsMap.get(res.driver_id)?.priority || 3,
      }));

      const sorted = enriched.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        if (a.slot_start_time !== b.slot_start_time) return (a.slot_start_time || '').localeCompare(b.slot_start_time || '');
        return (a.created_at || '').localeCompare(b.created_at || '');
      });
      setNextInQueue(sorted.slice(0, 10));

      const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);
      setNotificationCount(count || 0);
    } catch (error) {
      notifyError('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  }, [user, dateRange]);

  const getDateRangeFilter = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    if (dateRange === 'today') return { start: today.toISOString(), end: endOfDay.toISOString() };
    if (dateRange === 'week') {
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      return { start: start.toISOString(), end: endOfDay.toISOString() };
    }
    const start = new Date(today);
    start.setMonth(today.getMonth() - 1);
    return { start: start.toISOString(), end: endOfDay.toISOString() };
  };

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user, dateRange, loadDashboardData]);

  // Real-time subscriptions
  useRealtimeSubscription('reservations', { column: 'station_id', value: stationId || '' }, () => loadDashboardData(), [stationId]);
  useRealtimeSubscription('station_fuel_inventory', { column: 'station_id', value: stationId || '' }, () => loadDashboardData(), [stationId]);
  useRealtimeSubscription('notifications', { column: 'user_id', value: user?.id || '' }, (payload) => {
    if (payload.eventType === 'INSERT') setNotificationCount(prev => prev + 1);
  }, [user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    notifySuccess('Dashboard refreshed');
  };

  const stats: DashboardStats = {
    total: reservations.length,
    completed: reservations.filter(r => r.status === 'completed').length,
    pending: reservations.filter(r => r.status === 'confirmed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
    expired: reservations.filter(r => r.status === 'expired').length,
    active_now: reservations.filter(r => r.status === 'dispensing').length,
    total_fuel_dispensed: reservations.filter(r => r.status === 'completed').reduce((s, r) => s + (r.quantity || 0), 0),
    total_revenue: reservations.filter(r => r.status === 'completed').reduce((s, r) => s + (r.total_price || 0), 0),
  };

  const lowStockCount = inventory.filter(inv => inv.stock_status === 'low').length;
  const getStockPercentage = (current: number, max: number) => Math.min((current / max) * 100, 100);

  if (loading) return <div className="min-h-screen bg-gray-50 p-4"><Skeleton className="h-32" /><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">{Array(4).fill(0).map((_,i) => <Skeleton key={i} className="h-32" />)}</div><Skeleton className="h-64 mt-4" /></div>;
  if (!station) return <div className="min-h-screen bg-gray-50 p-4"><Card className="p-12 text-center"><AlertCircle className="size-20 mx-auto mb-4 text-yellow-500" /><h3 className="text-2xl font-bold mb-2">No Station Assigned</h3><p className="text-gray-600">You don't have a station assigned to your account yet.</p></Card></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-1">Operator Dashboard</h1>
              <p className="text-green-100 text-sm md:text-base">Welcome back, {user?.full_name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onNavigate('notifications')} className="relative p-2 hover:bg-white/20 rounded-full">
                <Bell className="size-5 text-white" />
                {notificationCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">{notificationCount}</span>}
              </button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2"><MapPin className="size-4 text-green-200" /><span className="text-green-100 truncate">{station.address?.split(',')[0]}</span></div>
            <div className="flex items-center gap-2"><Phone className="size-4 text-green-200" /><span className="text-green-100">{station.phone}</span></div>
            <div className="flex items-center gap-2"><Clock3 className="size-4 text-green-200" /><span className="text-green-100">{station.is_24_hours ? '24/7' : `${station.opening_time} - ${station.closing_time}`}</span></div>
            <div><Badge className="bg-white text-green-600">{station.is_active ? 'Active' : 'Inactive'}</Badge></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex justify-end">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Select range" /></SelectTrigger>
            <SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="week">This Week</SelectItem><SelectItem value="month">This Month</SelectItem></SelectContent>
          </Select>
        </div>

        {(lowStockCount > 0 || stats.active_now > 0) && (
          <div className="space-y-3">
            {stats.active_now > 0 && <Card className="p-4 bg-blue-50 border-blue-200"><div className="flex items-center gap-3"><Activity className="size-6 text-blue-600 animate-pulse" /><div className="flex-1"><p className="font-medium text-blue-900">Active Dispensing</p><p className="text-sm text-blue-800">{stats.active_now} customer(s) currently being served.</p></div><Button size="sm" onClick={() => onNavigate('reservations')}>View All</Button></div></Card>}
            {lowStockCount > 0 && <Card className="p-4 bg-yellow-50 border-yellow-200"><div className="flex items-center gap-3"><AlertTriangle className="size-6 text-yellow-600" /><div className="flex-1"><p className="font-medium text-yellow-900">Low Fuel Stock</p><p className="text-sm text-yellow-800">{lowStockCount} fuel type(s) running low.</p></div><Button variant="outline" size="sm" onClick={() => onNavigate('fuel')}>Check Inventory</Button></div></Card>}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="p-4"><div className="flex items-center justify-between mb-3"><Calendar className="size-8 text-blue-600" /><TrendingUp className="size-4 text-green-600" /></div><p className="text-2xl font-bold mb-1">{stats.total}</p><p className="text-xs text-gray-600">Total</p><p className="text-xs text-gray-400">{dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This week' : 'This month'}</p></Card>
          <Card className="p-4"><div className="flex items-center justify-between mb-3"><Users className="size-8 text-yellow-600" />{stats.pending > 0 && <Badge className="bg-yellow-600 text-xs">{stats.pending}</Badge>}</div><p className="text-2xl font-bold mb-1">{stats.pending}</p><p className="text-xs text-gray-600">In Queue</p></Card>
          <Card className="p-4"><div className="flex items-center justify-between mb-3"><Droplet className="size-8 text-orange-600" />{stats.active_now > 0 && <Badge className="bg-orange-600 animate-pulse text-xs">{stats.active_now}</Badge>}</div><p className="text-2xl font-bold mb-1">{stats.active_now}</p><p className="text-xs text-gray-600">Active Now</p></Card>
          <Card className="p-4"><div className="flex items-center justify-between mb-3"><CheckCircle className="size-8 text-green-600" /><TrendingUp className="size-4 text-green-600" /></div><p className="text-2xl font-bold mb-1">{stats.completed}</p><p className="text-xs text-gray-600">Completed</p></Card>
          <Card className="p-4"><div className="flex items-center justify-between mb-3"><XCircle className="size-8 text-red-600" /><AlertCircle className="size-4 text-red-600" /></div><p className="text-2xl font-bold mb-1">{stats.expired}</p><p className="text-xs text-gray-600">Expired</p></Card>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-blue-600 to-blue-700 text-white" onClick={() => onNavigate('verify')}><QrCode className="size-12 mb-3" /><h3 className="font-semibold text-lg mb-1">Verify Pickup Code</h3><p className="text-blue-100 text-sm">Scan or enter 6-digit code</p><div className="mt-4 flex items-center justify-between"><span className="text-xs font-medium">Quick Action</span><ArrowRight className="size-5" /></div></Card>
          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate('reservations')}><Calendar className="size-12 text-blue-600 mb-3" /><h3 className="font-semibold text-lg mb-1">View Reservations</h3><p className="text-gray-600 text-sm">Schedule and bookings</p><div className="mt-4 pt-3 border-t"><p className="text-xs font-medium text-gray-700">{stats.total} reservations {dateRange === 'today' ? 'today' : 'in period'}</p></div></Card>
          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate('fuel')}><Fuel className="size-12 text-green-600 mb-3" /><h3 className="font-semibold text-lg mb-1">Fuel Management</h3><p className="text-gray-600 text-sm">View inventory status</p><div className="mt-4 pt-3 border-t"><p className="text-xs font-medium text-gray-700">{inventory.length} fuel types</p></div></Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4"><Users className="size-5 text-primary" /><h3 className="font-semibold text-lg">Next in Queue</h3><Badge className="bg-yellow-600">{nextInQueue.length} waiting</Badge></div>
            {nextInQueue.length === 0 ? (
              <div className="text-center py-8"><Users className="size-12 mx-auto mb-3 text-gray-400" /><p className="text-gray-600 mb-2">No customers in queue</p><p className="text-sm text-gray-500">Waiting for new reservations</p></div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {nextInQueue.map((res, idx) => (
                  <div key={res.id} className="p-4 rounded-lg border-2 bg-gray-50 border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">{idx + 1}</div><div><p className="font-medium">{res.driver_name}</p><p className="text-sm text-gray-600">{res.driver_phone}</p></div></div>
                      <Badge className="bg-yellow-600">Confirmed</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div className="flex items-center gap-2"><Fuel className="size-4 text-gray-500" /><div><p className="text-xs text-gray-500">Fuel Type</p><p className="font-medium">{res.fuel_type_name}</p></div></div>
                      <div className="flex items-center gap-2"><Droplet className="size-4 text-gray-500" /><div><p className="text-xs text-gray-500">Quantity</p><p className="font-medium">{res.quantity}L</p></div></div>
                      <div className="flex items-center gap-2"><Clock className="size-4 text-gray-500" /><div><p className="text-xs text-gray-500">Time Slot</p><p className="font-medium">{res.slot_start_time}</p></div></div>
                      <div className="flex items-center gap-2"><DollarSign className="size-4 text-gray-500" /><div><p className="text-xs text-gray-500">Amount</p><p className="font-medium text-green-600">ETB {res.total_price.toLocaleString()}</p></div></div>
                    </div>
                    <div className="flex items-center gap-3 pt-2 border-t text-xs text-gray-500">
                      <div className="flex items-center gap-1"><Car className="size-3" /> {res.driver_plate || 'Not set'}</div>
                      <div className="flex items-center gap-1">{getPriorityIcon(res.car_class)} {res.car_class}</div>
                      {res.priority === 1 && <Badge className="bg-red-100 text-red-700">High Priority</Badge>}
                      {res.priority === 2 && <Badge className="bg-green-100 text-green-700">Agricultural Priority</Badge>}
                    </div>
                    <div className="flex items-center justify-between pt-3 mt-2 border-t">
                      <div className="flex items-center gap-2 text-gray-500"><Clock className="size-4" /><span className="text-sm">Awaiting verification</span></div>
                      <Button size="sm" onClick={() => onNavigate('verify')}>Verify Code</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4"><Fuel className="size-5 text-primary" /><h3 className="font-semibold text-lg">Fuel Inventory</h3><Button variant="outline" size="sm" onClick={() => onNavigate('fuel')}>View Details</Button></div>
            {inventory.length === 0 ? (
              <div className="text-center py-8"><Fuel className="size-12 mx-auto mb-3 text-gray-400" /><p className="text-gray-600">No fuel inventory data</p></div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {inventory.map((item) => {
                  const percentage = getStockPercentage(item.current_stock, item.maximum_capacity);
                  return (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-center justify-between"><div><p className="font-medium">{item.fuel_type_name}</p><p className="text-xs text-gray-500">{item.fuel_type_code}</p></div><Badge className={item.stock_status === 'low' ? 'bg-red-600' : item.stock_status === 'moderate' ? 'bg-yellow-600' : 'bg-green-600'}>{item.stock_status?.toUpperCase()}</Badge></div>
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500"><span>{percentage.toFixed(0)}% capacity</span><span>Max: {item.maximum_capacity.toLocaleString()}L</span></div>
                      {item.stock_status === 'low' && <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg"><AlertTriangle className="size-4 text-red-600" /><span className="text-xs text-red-700 font-medium">Below minimum threshold ({item.minimum_stock_threshold}L)</span></div>}
                      <Separator />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4"><TrendingUp className="size-5 text-primary" /><h3 className="font-semibold text-lg">Performance Overview</h3></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg"><CheckCircle2 className="size-8 mx-auto mb-2 text-green-600" /><p className="text-2xl font-bold text-green-600">{stats.completed}</p><p className="text-xs text-gray-600 mt-1">Completed</p></div>
            <div className="text-center p-4 bg-blue-50 rounded-lg"><Droplet className="size-8 mx-auto mb-2 text-blue-600" /><p className="text-2xl font-bold">{stats.total_fuel_dispensed.toLocaleString()} L</p><p className="text-xs text-gray-600 mt-1">Fuel Dispensed</p></div>
            <div className="text-center p-4 bg-purple-50 rounded-lg"><DollarSign className="size-8 mx-auto mb-2 text-purple-600" /><p className="text-2xl font-bold text-purple-600">ETB {stats.total_revenue.toLocaleString()}</p><p className="text-xs text-gray-600 mt-1">Revenue</p></div>
            <div className="text-center p-4 bg-red-50 rounded-lg"><XCircle className="size-8 mx-auto mb-2 text-red-600" /><p className="text-2xl font-bold text-red-600">{stats.cancelled + stats.expired}</p><p className="text-xs text-gray-600 mt-1">Cancelled/Expired</p></div>
          </div>
        </Card>
      </div>
    </div>
  );
}