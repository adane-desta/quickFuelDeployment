import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockReservations } from '../../data/mockData';
import { Reservation } from '../../types';
import { Calendar, Clock, Fuel, User, Phone, Car, CheckCircle, XCircle, AlertCircle, Search, Loader2 } from 'lucide-react';

export function OperatorReservations() {
  const { user } = useAuth();
  const stationId = user?.stationId || '1';
  const allReservations = mockReservations.filter(r => r.stationId === stationId);
  const [reservations, setReservations] = useState<Reservation[]>(allReservations);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'completed' | 'cancelled'>('all');
  const [search, setSearch] = useState('');
  const [completing, setCompleting] = useState<string | null>(null);

  const filtered = reservations.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = !search || r.driverName.toLowerCase().includes(search.toLowerCase()) ||
      r.pickupCode.includes(search) || (r.plateNumber || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleComplete = async (id: string) => {
    setCompleting(id);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' as const } : r));
    setCompleting(null);
  };

  const getStatusConfig = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed': return { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Confirmed' };
      case 'completed': return { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: 'Completed' };
      case 'cancelled': return { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelled' };
      case 'pending': return { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, label: 'Pending' };
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-gray-900 mb-1">Reservations</h1>
        <p className="text-gray-600">Manage incoming fuel reservations at your station</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, pickup code, or plate number..."
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {(['all', 'confirmed', 'pending', 'completed', 'cancelled'] as const).map(f => {
            const count = f === 'all' ? reservations.length : reservations.filter(r => r.status === f).length;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors text-sm ${
                  filter === f ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Reservations Table/Cards */}
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
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Pickup Code</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(res => {
                  const sc = getStatusConfig(res.status);
                  return (
                    <tr key={res.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-gray-900 text-sm">{res.driverName}</p>
                        <p className="text-xs text-gray-500">{res.driverPhone}</p>
                        <p className="text-xs text-gray-500">{res.plateNumber}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{formatDate(res.date)}</p>
                        <p className="text-xs text-gray-500">{res.timeSlot}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{res.fuelType} - {res.quantity}L</p>
                        <p className="text-xs text-gray-500">ETB {res.totalCost.toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm tracking-wider bg-gray-100 px-3 py-1 rounded">{res.pickupCode}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${sc.color}`}>
                          <sc.icon className="w-3 h-3" /> {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {res.status === 'confirmed' && (
                          <button onClick={() => handleComplete(res.id)} disabled={completing === res.id}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60">
                            {completing === res.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete'}
                          </button>
                        )}
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
              return (
                <div key={res.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-gray-900">{res.driverName}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Phone className="w-3 h-3" /> {res.driverPhone}
                      </div>
                      {res.plateNumber && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Car className="w-3 h-3" /> {res.plateNumber}
                        </div>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${sc.color}`}>
                      <sc.icon className="w-3 h-3" /> {sc.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{formatDate(res.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{res.timeSlot}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{res.fuelType} {res.quantity}L</span>
                    </div>
                    <div>
                      <span className="text-gray-700">ETB {res.totalCost.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 mb-3 text-center">
                    <p className="text-xs text-gray-500">Pickup Code</p>
                    <p className="text-xl tracking-wider text-gray-900">{res.pickupCode}</p>
                  </div>
                  {res.status === 'confirmed' && (
                    <button onClick={() => handleComplete(res.id)} disabled={completing === res.id}
                      className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                      {completing === res.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Mark as Completed</>}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
