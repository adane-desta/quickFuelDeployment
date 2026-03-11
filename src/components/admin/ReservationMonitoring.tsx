import { useState } from 'react';
import { mockReservations } from '../../data/mockData';
import { Reservation } from '../../types';
import {
  Calendar, Search, CheckCircle, XCircle, AlertCircle, Clock, Fuel, User, Building2, CreditCard
} from 'lucide-react';

export function ReservationMonitoring() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'completed' | 'cancelled' | 'pending'>('all');

  const filtered = mockReservations.filter(r => {
    const matchesSearch = !search || r.driverName.toLowerCase().includes(search.toLowerCase()) ||
      r.stationName.toLowerCase().includes(search.toLowerCase()) || r.pickupCode.includes(search);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = mockReservations.filter(r => r.status !== 'cancelled').reduce((sum, r) => sum + r.totalCost, 0);

  const getStatusConfig = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed': return { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Confirmed' };
      case 'completed': return { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: 'Completed' };
      case 'cancelled': return { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelled' };
      case 'pending': return { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, label: 'Pending' };
    }
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-gray-900 mb-1">Reservation Monitoring</h1>
        <p className="text-gray-600">Monitor all reservations across the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: mockReservations.length, color: 'text-blue-600' },
          { label: 'Confirmed', value: mockReservations.filter(r => r.status === 'confirmed').length, color: 'text-green-600' },
          { label: 'Completed', value: mockReservations.filter(r => r.status === 'completed').length, color: 'text-purple-600' },
          { label: 'Revenue (ETB)', value: totalRevenue.toLocaleString(), color: 'text-emerald-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className={`text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by driver, station, or pickup code..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'confirmed', 'pending', 'completed', 'cancelled'] as const).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm transition-colors ${
                statusFilter === f ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

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
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">{r.driverName}</p>
                    <p className="text-xs text-gray-500">{r.plateNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.stationName}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">{new Date(r.date).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">{r.timeSlot}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{r.fuelType} {r.quantity}L</td>
                  <td className="px-4 py-3 text-sm text-gray-900">ETB {r.totalCost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${sc.color}`}>
                      <sc.icon className="w-3 h-3" /> {sc.label}
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
          return (
            <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-gray-900 text-sm">{r.driverName}</p>
                  <p className="text-xs text-gray-500">{r.stationName}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${sc.color}`}>
                  <sc.icon className="w-3 h-3" /> {sc.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar className="w-3 h-3" /> {new Date(r.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-3 h-3" /> {r.timeSlot}
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Fuel className="w-3 h-3" /> {r.fuelType} {r.quantity}L
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <CreditCard className="w-3 h-3" /> ETB {r.totalCost.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
