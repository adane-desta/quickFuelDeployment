import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { stationService } from '../../lib/supabase/database';
import { reservationService } from '../../lib/supabase/database-advanced';
import { notifyError } from '../../lib/utils/notifications';
import type { Reservation } from '../../types/advanced';
import {
  Calendar, Clock, Fuel, User, Phone, Car, CheckCircle, XCircle,
  AlertCircle, Search, Loader2, Filter
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

type DateRange = 'today' | 'week' | 'month';
type StatusFilter = 'all' | 'confirmed' | 'arrived' | 'dispensing' | 'completed' | 'cancelled' | 'expired';

export function OperatorReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [search, setSearch] = useState('');
  const [stationId, setStationId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadReservations();
  }, [user, dateRange]);

  const getDateRangeFilter = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    if (dateRange === 'today') {
      return { start: today.toISOString(), end: endOfDay.toISOString() };
    } else if (dateRange === 'week') {
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      return { start: start.toISOString(), end: endOfDay.toISOString() };
    } else {
      const start = new Date(today);
      start.setMonth(today.getMonth() - 1);
      return { start: start.toISOString(), end: endOfDay.toISOString() };
    }
  };

  const loadReservations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const station = await stationService.getOperatorStation(user.id);
      if (!station) {
        setLoading(false);
        return;
      }
      setStationId(station.id);
      const allRes = await reservationService.getStationReservations(station.id);
      const { start, end } = getDateRangeFilter();
      const filteredByDate = allRes.filter(r => {
        const slotDate = r.slot_date;
        return slotDate >= start && slotDate <= end;
      });
      setReservations(filteredByDate);
    } catch (error) {
      notifyError('Failed to load reservations', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = reservations.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSearch = !search ||
      r.driver_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.pickup_code.includes(search) ||
      r.driver_plate?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  }).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')); // recent first

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed': return { color: 'bg-yellow-100 text-yellow-700', icon: CheckCircle, label: 'Confirmed' };
      case 'arrived': return { color: 'bg-orange-100 text-orange-700', icon: Clock, label: 'Arrived' };
      case 'dispensing': return { color: 'bg-blue-100 text-blue-700', icon: Fuel, label: 'Dispensing' };
      case 'completed': return { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Completed' };
      case 'cancelled': return { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelled' };
      case 'expired': return { color: 'bg-gray-100 text-gray-700', icon: AlertCircle, label: 'Expired' };
      default: return { color: 'bg-gray-100 text-gray-700', icon: AlertCircle, label: status };
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-32 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (!stationId) {
    return (
      <div className="p-4 lg:p-8">
        <Card className="p-12 text-center">
          <AlertCircle className="size-20 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-2xl font-bold mb-2">No Station Assigned</h3>
          <p className="text-gray-600">You don't have a station assigned to your account yet.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Reservations</h1>
        <p className="text-gray-600">Manage fuel reservations at your station</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, pickup code, or plate number..."
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
            />
          </div>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {(['all', 'confirmed', 'arrived', 'dispensing', 'completed', 'cancelled', 'expired'] as const).map(f => {
            const count = f === 'all' ? reservations.length : reservations.filter(r => r.status === f).length;
            return (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm ${
                  statusFilter === f ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>No reservations found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Driver</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Date & Time</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Fuel</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(res => {
                  const sc = getStatusConfig(res.status);
                  const Icon = sc.icon;
                  return (
                    <tr key={res.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-gray-900 text-sm font-medium">{res.driver_name}</p>
                        <p className="text-xs text-gray-500">{res.driver_phone}</p>
                        {res.driver_plate && <p className="text-xs text-gray-500">🚗 {res.driver_plate}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{formatDate(res.slot_date!)}</p>
                        <p className="text-xs text-gray-500">{res.slot_start_time} - {res.slot_end_time}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{res.fuel_type_name}</p>
                        <p className="text-xs text-gray-500">{res.quantity} Liters</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-green-600">ETB {res.total_price.toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${sc.color}`}>
                          <Icon className="w-3 h-3" /> {sc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map(res => {
              const sc = getStatusConfig(res.status);
              const Icon = sc.icon;
              return (
                <div key={res.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-gray-900 font-medium">{res.driver_name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Phone className="w-3 h-3" /> {res.driver_phone}
                      </div>
                      {res.driver_plate && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Car className="w-3 h-3" /> {res.driver_plate}
                        </div>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${sc.color}`}>
                      <Icon className="w-3 h-3" /> {sc.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{formatDate(res.slot_date!)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{res.slot_start_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{res.fuel_type_name} {res.quantity}L</span>
                    </div>
                    <div>
                      <span className="text-green-600 font-medium">ETB {res.total_price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}