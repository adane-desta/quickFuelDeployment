import { useAuth } from '../../contexts/AuthContext';
import { mockUsers, mockStations, mockReservations, mockSystemActivities } from '../../data/mockData';
import {
  Users, Building2, Calendar, Activity, TrendingUp, CheckCircle, AlertTriangle, ArrowRight,
  UserCheck, UserX, Fuel, Clock, DollarSign, BarChart3
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { user } = useAuth();
  const totalDrivers = mockUsers.filter(u => u.role === 'driver').length;
  const totalOperators = mockUsers.filter(u => u.role === 'operator').length;
  const totalStations = mockStations.length;
  const verifiedStations = mockStations.filter(s => s.verified).length;
  const totalReservations = mockReservations.length;
  const activeUsers = mockUsers.filter(u => u.isActive).length;

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-gray-900 mb-1">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.fullName}. Here's your system overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', value: mockUsers.length, icon: Users, color: 'bg-blue-100 text-blue-600', sub: `${activeUsers} active` },
          { label: 'Drivers', value: totalDrivers, icon: UserCheck, color: 'bg-green-100 text-green-600', sub: 'Registered' },
          { label: 'Operators', value: totalOperators, icon: Building2, color: 'bg-orange-100 text-orange-600', sub: `${verifiedStations} verified` },
          { label: 'Reservations', value: totalReservations, icon: Calendar, color: 'bg-purple-100 text-purple-600', sub: 'Total' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl text-gray-900">{stat.value}</p>
            </div>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-xs text-gray-400">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Station Verification */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-orange-50 px-4 py-3 border-b border-orange-100 flex items-center justify-between">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-600" /> Stations Overview
            </h3>
            <button onClick={() => onNavigate('stations')} className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1">
              Manage <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-2xl text-green-700">{verifiedStations}</p>
                <p className="text-xs text-gray-500">Verified</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg text-center">
                <p className="text-2xl text-yellow-700">{totalStations - verifiedStations}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
            <div className="space-y-2">
              {mockStations.filter(s => !s.verified).map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <p className="text-sm text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.address}</p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Pending</span>
                </div>
              ))}
              {mockStations.filter(s => !s.verified).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">All stations verified</p>
              )}
            </div>
          </div>
        </div>

        {/* User Management Quick View */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center justify-between">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> User Overview
            </h3>
            <button onClick={() => onNavigate('users')} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Manage <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xl text-blue-700">{totalDrivers}</p>
                <p className="text-xs text-gray-500">Drivers</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xl text-green-700">{totalOperators}</p>
                <p className="text-xs text-gray-500">Operators</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-xl text-purple-700">{mockUsers.filter(u => u.role === 'admin').length}</p>
                <p className="text-xs text-gray-500">Admins</p>
              </div>
            </div>
            <div className="space-y-2">
              {mockUsers.filter(u => !u.isActive).map(u => (
                <div key={u.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-red-500" />
                    <div>
                      <p className="text-sm text-gray-900">{u.fullName}</p>
                      <p className="text-xs text-gray-500">{u.role} - {u.email}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Inactive</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Fuel Price Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('fuelprices')}>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-green-100 flex items-center justify-between">
            <h3 className="text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" /> Fuel Price Management
            </h3>
            <button onClick={() => onNavigate('fuelprices')} className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
              Manage <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-3">Set and manage system-wide fuel prices across all stations</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-lg text-blue-700">ETB 65.00</p>
                <p className="text-xs text-gray-500">Petrol /L</p>
              </div>
              <div className="flex-1 p-3 bg-green-50 rounded-lg text-center">
                <p className="text-lg text-green-700">ETB 58.00</p>
                <p className="text-xs text-gray-500">Diesel /L</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Analytics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('analytics')}>
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 border-b border-purple-100 flex items-center justify-between">
            <h3 className="text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" /> System Analytics
            </h3>
            <button onClick={() => onNavigate('analytics')} className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
              View <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-3">Comprehensive fuel availability and dispensing analytics</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-green-50 rounded-lg text-center">
                <p className="text-sm text-green-700">45,600L</p>
                <p className="text-xs text-gray-500">Available</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-center">
                <p className="text-sm text-blue-700">91,950L</p>
                <p className="text-xs text-gray-500">Dispensed</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg text-center">
                <p className="text-sm text-purple-700">74.2%</p>
                <p className="text-xs text-gray-500">Digital</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-600" /> Recent System Activity
          </h3>
          <button onClick={() => onNavigate('activity')} className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y divide-gray-200">
          {mockSystemActivities.slice(0, 6).map(activity => {
            const typeColors: Record<string, string> = {
              reservation_made: 'bg-blue-100 text-blue-600',
              fuel_updated: 'bg-green-100 text-green-600',
              user_registered: 'bg-purple-100 text-purple-600',
              queue_reported: 'bg-yellow-100 text-yellow-600',
              payment_processed: 'bg-emerald-100 text-emerald-600',
              station_verified: 'bg-orange-100 text-orange-600',
              user_deactivated: 'bg-red-100 text-red-600',
            };
            return (
              <div key={activity.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${typeColors[activity.type] || 'bg-gray-100 text-gray-600'}`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.details}</p>
                    <p className="text-xs text-gray-400 mt-1">By {activity.actor} - {new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}