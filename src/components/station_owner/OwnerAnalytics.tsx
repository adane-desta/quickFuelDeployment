import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { stationService } from '../../lib/supabase/database';
import { supabase } from '../../lib/supabase/client';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Fuel,
  DollarSign,
  CheckCircle,
  XCircle,
  Droplet,
  BarChart3,
  Download,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

type DateRange = 'today' | 'week' | 'month';

interface DashboardAnalytics {
  total_reservations: number;
  completed_reservations: number;
  cancelled_reservations: number;
  total_revenue: number;
  total_fuel_dispensed: number;
  completion_rate: number;
  avg_order_value: number;
}

interface FuelTypeAnalytics {
  fuel_type_name: string;
  fuel_type_code: string;
  quantity_dispensed: number;
  revenue: number;
  reservation_count: number;
}

interface DailyData {
  date: string;
  reservations: number;
  revenue: number;
  fuel_dispensed: number;
}

export function OwnerAnalytics() {
  const { user } = useAuth();
  const [stationId, setStationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [fuelAnalytics, setFuelAnalytics] = useState<FuelTypeAnalytics[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) loadStationAndData();
  }, [user, dateRange]);

  const loadStationAndData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get owner's station
      const stationsData = await stationService.getOwnerStations(user.id);
      if (!stationsData || stationsData.length === 0) {
        setLoading(false);
        return;
      }
      const station = stationsData[0];
      setStationId(station.id);

      await loadAnalyticsData(station.id);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsData = async (stationIdParam: string) => {
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (dateRange === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (dateRange === 'week') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date();
      startDate.setMonth(now.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
    }

    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    // Fetch reservations in date range
    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select('id, status, total_price, quantity, fuel_type_id, created_at, completed_at')
      .eq('station_id', stationIdParam)
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (resError) throw resError;

    // Fetch refund fees for the same period
    const { data: refundFees, error: feeError } = await supabase
      .from('station_refund_fees')
      .select('fee_amount, created_at')
      .eq('station_id', stationIdParam)
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (feeError) {
      console.error('Error fetching refund fees:', feeError);
    }

    const totalRefundFees = refundFees?.reduce((sum, fee) => sum + (fee.fee_amount || 0), 0) || 0;

    // Fetch fuel types for mapping
    const { data: fuelTypes, error: ftError } = await supabase
      .from('fuel_types')
      .select('id, name, code');
    if (ftError) throw ftError;
    const fuelTypeMap = new Map(fuelTypes.map(ft => [ft.id, ft]));

    // Calculate aggregates
    const completedRes = reservations?.filter(r => r.status === 'completed') || [];
    const cancelledRes = reservations?.filter(r => r.status === 'cancelled' || r.status === 'expired') || [];
    const completedReservationsRevenue = completedRes.reduce((sum, r) => sum + (r.total_price || 0), 0);
    const totalRevenue = completedReservationsRevenue + totalRefundFees;
    const totalFuelDispensed = completedRes.reduce((sum, r) => sum + (r.quantity || 0), 0);
    const completionRate = reservations?.length ? (completedRes.length / reservations.length) * 100 : 0;
    const avgOrderValue = completedRes.length ? completedReservationsRevenue / completedRes.length : 0;

    setAnalytics({
      total_reservations: reservations?.length || 0,
      completed_reservations: completedRes.length,
      cancelled_reservations: cancelledRes.length,
      total_revenue: totalRevenue,
      total_fuel_dispensed: totalFuelDispensed,
      completion_rate: completionRate,
      avg_order_value: avgOrderValue,
    });

    // Fuel type breakdown
    const fuelMap = new Map<string, FuelTypeAnalytics>();
    for (const res of completedRes) {
      const ft = fuelTypeMap.get(res.fuel_type_id);
      if (!ft) continue;
      const fuelName = ft.name;
      const existing = fuelMap.get(fuelName);
      if (existing) {
        existing.quantity_dispensed += res.quantity || 0;
        existing.revenue += res.total_price || 0;
        existing.reservation_count += 1;
      } else {
        fuelMap.set(fuelName, {
          fuel_type_name: fuelName,
          fuel_type_code: ft.code,
          quantity_dispensed: res.quantity || 0,
          revenue: res.total_price || 0,
          reservation_count: 1,
        });
      }
    }
    setFuelAnalytics(Array.from(fuelMap.values()));

    // Daily data for line chart (group by date)
    const dailyMap = new Map<string, DailyData>();
    for (const res of reservations || []) {
      const date = new Date(res.created_at).toISOString().split('T')[0];
      const existing = dailyMap.get(date);
      if (existing) {
        existing.reservations += 1;
        existing.revenue += res.total_price || 0;
        existing.fuel_dispensed += (res.status === 'completed' ? res.quantity || 0 : 0);
      } else {
        dailyMap.set(date, {
          date,
          reservations: 1,
          revenue: res.total_price || 0,
          fuel_dispensed: (res.status === 'completed' ? res.quantity || 0 : 0),
        });
      }
    }
    const dailyArray = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    setDailyData(dailyArray);
  };

  const handleRefresh = async () => {
    if (!stationId) return;
    setRefreshing(true);
    await loadAnalyticsData(stationId);
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  const exportReport = () => {
    // Simple CSV export
    const rows = [
      ['Metric', 'Value'],
      ['Total Reservations', analytics?.total_reservations || 0],
      ['Completed Reservations', analytics?.completed_reservations || 0],
      ['Cancelled/Expired', analytics?.cancelled_reservations || 0],
      ['Total Revenue (ETB)', analytics?.total_revenue?.toFixed(2) || 0],
      ['Total Fuel Dispensed (L)', analytics?.total_fuel_dispensed || 0],
      ['Completion Rate (%)', analytics?.completion_rate?.toFixed(1) || 0],
      ['Average Order Value (ETB)', analytics?.avg_order_value?.toFixed(2) || 0],
      [],
      ['Fuel Type', 'Dispensed (L)', 'Revenue (ETB)', 'Reservations'],
      ...fuelAnalytics.map(f => [f.fuel_type_name, f.quantity_dispensed, f.revenue.toFixed(2), f.reservation_count]),
    ];
    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `station_analytics_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec489a', '#06b6d4'];

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!stationId) {
    return (
      <div className="p-8 text-center">
        <Card className="p-12">
          <h3 className="text-xl font-bold mb-2">No Station Found</h3>
          <p className="text-gray-600">You don't have any stations assigned to your account.</p>
        </Card>
      </div>
    );
  }

  const rangeLabel = dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This Week' : 'This Month';

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Station Analytics</h1>
          <p className="text-gray-600">Performance metrics and insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="icon" onClick={exportReport}>
            <Download className="size-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="size-8 text-blue-600" />
            <TrendingUp className="size-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold">{analytics?.total_reservations || 0}</p>
          <p className="text-sm text-gray-600">Total Reservations</p>
          <p className="text-xs text-gray-400">{rangeLabel}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="size-8 text-green-600" />
            <TrendingUp className="size-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold">ETB {(analytics?.total_revenue || 0).toLocaleString()}</p>
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-xs text-gray-400">{rangeLabel}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Droplet className="size-8 text-blue-600" />
            <Fuel className="size-5 text-gray-500" />
          </div>
          <p className="text-2xl font-bold">{analytics?.total_fuel_dispensed?.toLocaleString()} L</p>
          <p className="text-sm text-gray-600">Fuel Dispensed</p>
          <p className="text-xs text-gray-400">{rangeLabel}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="size-8 text-green-600" />
            <span className="text-sm font-medium">{analytics?.completion_rate?.toFixed(0)}%</span>
          </div>
          <p className="text-2xl font-bold">{analytics?.completed_reservations || 0}</p>
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-xs text-gray-400">of {analytics?.total_reservations || 0} total</p>
        </Card>
      </div>

      {/* Daily Trends (Line Chart) */}
      <Card className="p-5">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <BarChart3 className="size-5 text-primary" />
          Daily Trends ({rangeLabel})
        </h3>
        {dailyData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No data available for this period</div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="reservations" stroke="#3b82f6" name="Reservations" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue (ETB)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Fuel Type Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card className="p-5">
          <h3 className="font-semibold text-lg mb-4">Fuel Dispensed by Type</h3>
          {fuelAnalytics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No fuel dispensed in this period</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fuelAnalytics}
                    dataKey="quantity_dispensed"
                    nameKey="fuel_type_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {fuelAnalytics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} L`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Fuel Table */}
        <Card className="p-5">
          <h3 className="font-semibold text-lg mb-4">Detailed Fuel Breakdown</h3>
          {fuelAnalytics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3">Fuel Type</th>
                    <th className="text-right py-2 px-3">Dispensed (L)</th>
                    <th className="text-right py-2 px-3">Revenue (ETB)</th>
                    <th className="text-right py-2 px-3">Reservations</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fuelAnalytics.map((fuel, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{fuel.fuel_type_name}</td>
                      <td className="text-right py-2 px-3">{fuel.quantity_dispensed.toLocaleString()}</td>
                      <td className="text-right py-2 px-3">{fuel.revenue.toLocaleString()}</td>
                      <td className="text-right py-2 px-3">{fuel.reservation_count}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-semibold">
                  <tr>
                    <td className="py-2 px-3">Total</td>
                    <td className="text-right py-2 px-3">{fuelAnalytics.reduce((s, f) => s + f.quantity_dispensed, 0).toLocaleString()} L</td>
                    <td className="text-right py-2 px-3">{fuelAnalytics.reduce((s, f) => s + f.revenue, 0).toLocaleString()}</td>
                    <td className="text-right py-2 px-3">{fuelAnalytics.reduce((s, f) => s + f.reservation_count, 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Cancelled / Expired</p>
          <p className="text-2xl font-bold text-red-600">{analytics?.cancelled_reservations || 0}</p>
          <p className="text-xs text-gray-500">of {analytics?.total_reservations || 0} total</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Average Order Value</p>
          <p className="text-2xl font-bold text-green-600">ETB {(analytics?.avg_order_value || 0).toFixed(2)}</p>
          <p className="text-xs text-gray-500">per completed reservation</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Completion Rate</p>
          <p className="text-2xl font-bold text-blue-600">{analytics?.completion_rate?.toFixed(1)}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${analytics?.completion_rate || 0}%` }} />
          </div>
        </Card>
      </div>
    </div>
  );
}