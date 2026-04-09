import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { Calendar, Search, CheckCircle, XCircle, AlertCircle, Clock, Fuel, User, Building2, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { notifyError } from '../../lib/utils/notifications';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

type ReservationWithDetails = {
  id: string;
  driver_name: string;
  driver_phone: string;
  plate_number: string;
  station_name: string;
  station_address: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  fuel_type_name: string;
  quantity: number;
  total_price: number;
  payment_method: string;
  payment_status: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  pickup_code: string;
};

export function ReservationMonitoring() {
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'completed' | 'cancelled' | 'pending'>('all');

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          quantity,
          total_price,
          payment_method,
          payment_status,
          status,
          created_at,
          completed_at,
          cancelled_at,
          pickup_code,
          driver:driver_id (full_name, phone, plate_number),
          station:station_id (name, address),
          time_slot:time_slot_id (slot_date, start_time, end_time),
          fuel_type:fuel_type_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        id: item.id,
        driver_name: item.driver?.full_name || 'Unknown',
        driver_phone: item.driver?.phone || 'N/A',
        plate_number: item.driver?.plate_number || 'N/A',
        station_name: item.station?.name || 'Unknown',
        station_address: item.station?.address || '',
        slot_date: item.time_slot?.slot_date,
        start_time: item.time_slot?.start_time,
        end_time: item.time_slot?.end_time,
        fuel_type_name: item.fuel_type?.name || 'Unknown',
        quantity: item.quantity,
        total_price: item.total_price,
        payment_method: item.payment_method,
        payment_status: item.payment_status,
        status: item.status,
        created_at: item.created_at,
        completed_at: item.completed_at,
        cancelled_at: item.cancelled_at,
        pickup_code: item.pickup_code,
      }));
      setReservations(formatted);
    } catch (error) {
      console.error('Error loading reservations:', error);
      notifyError('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const filtered = reservations.filter(r => {
    const matchesSearch = !search || 
      r.driver_name.toLowerCase().includes(search.toLowerCase()) ||
      r.station_name.toLowerCase().includes(search.toLowerCase()) ||
      r.pickup_code.includes(search);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = reservations
    .filter(r => r.status !== 'cancelled')
    .reduce((sum, r) => sum + r.total_price, 0);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed': return { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Confirmed' };
      case 'completed': return { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: 'Completed' };
      case 'cancelled': return { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelled' };
      case 'pending': return { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, label: 'Pending' };
      default: return { color: 'bg-gray-100 text-gray-700', icon: AlertCircle, label: status };
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Reservation Monitoring</h1>
        <p className="text-gray-600">Monitor all reservations across the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: reservations.length, color: 'text-blue-600' },
          { label: 'Confirmed', value: reservations.filter(r => r.status === 'confirmed').length, color: 'text-green-600' },
          { label: 'Completed', value: reservations.filter(r => r.status === 'completed').length, color: 'text-purple-600' },
          { label: 'Revenue (ETB)', value: totalRevenue.toLocaleString(), color: 'text-emerald-600' },
        ].map((stat, i) => (
          <Card key={i} className="p-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by driver, station, or pickup code..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f as any)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm transition-colors ${
                statusFilter === f ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No reservations found</p>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Driver</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Station</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Date & Time</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Fuel</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Payment</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(r => {
                  const sc = getStatusConfig(r.status);
                  const StatusIcon = sc.icon;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{r.driver_name}</p>
                        <p className="text-xs text-gray-500">{r.plate_number}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.station_name}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{new Date(r.slot_date).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">{r.start_time} – {r.end_time}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{r.fuel_type_name} {r.quantity}L</td>
                      <td className="px-4 py-3 text-sm text-gray-900">ETB {r.total_price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.payment_method}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${sc.color}`}>
                          <StatusIcon className="w-3 h-3" /> {sc.label}
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
            {filtered.map(r => {
              const sc = getStatusConfig(r.status);
              const StatusIcon = sc.icon;
              return (
                <Card key={r.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-gray-900 text-sm">{r.driver_name}</p>
                      <p className="text-xs text-gray-500">{r.station_name}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${sc.color}`}>
                      <StatusIcon className="w-3 h-3" /> {sc.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar className="w-3 h-3" /> {new Date(r.slot_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-3 h-3" /> {r.start_time} – {r.end_time}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Fuel className="w-3 h-3" /> {r.fuel_type_name} {r.quantity}L
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <CreditCard className="w-3 h-3" /> ETB {r.total_price.toLocaleString()}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}