import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { db } from '../../lib/supabase/services'; // for system activity, if needed
import {
  Users, Building2, Calendar, Activity, TrendingUp, CheckCircle, AlertTriangle, ArrowRight,
  UserCheck, UserX, Fuel, Clock, DollarSign, BarChart3, Loader2
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalDrivers: 0,
    totalOperators: 0,
    totalAdmins: 0,
    totalStations: 0,
    verifiedStations: 0,
    pendingStations: 0,
    totalReservations: 0,
    pendingStationsList: [] as any[],
    inactiveUsersList: [] as any[],
    recentActivities: [] as any[],
    fuelPrices: [] as any[],
    analytics: { totalAvailable: 0, totalDispensed: 0, digitalRate: 0 },
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Users stats
      const { data: users } = await supabase.from('users').select('id, role, is_active');
      const totalUsers = users?.length || 0;
      const activeUsers = users?.filter(u => u.is_active).length || 0;
      const totalDrivers = users?.filter(u => u.role === 'driver').length || 0;
      const totalOperators = users?.filter(u => u.role === 'operator').length || 0;
      const totalAdmins = users?.filter(u => u.role === 'admin').length || 0;

      // 2. Stations stats
      const { data: stations } = await supabase.from('stations').select('id, name, address, is_verified');
      const totalStations = stations?.length || 0;
      const verifiedStations = stations?.filter(s => s.is_verified).length || 0;
      const pendingStations = totalStations - verifiedStations;
      const pendingStationsList = stations?.filter(s => !s.is_verified) || [];

      // 3. Reservations count
      const { count: totalReservations, error: resError } = await supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true });
      if (resError) console.error('Error fetching reservations count:', resError);
      const reservationsCount = totalReservations || 0;

      // 4. Inactive users
      const { data: inactiveUsers } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .eq('is_active', false);
      const inactiveUsersList = inactiveUsers || [];

      // 5. Recent system activity
      const { data: activities } = await supabase
        .from('system_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);
      const recentActivities = activities || [];

      // 6. Fuel prices (current active prices)
      const { data: fuelTypes } = await supabase
        .from('fuel_types')
        .select('name, base_price_per_liter')
        .in('name', ['Petrol', 'Diesel']);
      const fuelPrices = fuelTypes || [];

      // 7. Analytics summary
      // Total available fuel: sum of total_available from fuel_analytics
      const { data: analyticsData } = await supabase
        .from('fuel_analytics')
        .select('total_available, total_dispensed, digital_dispensed');
      let totalAvailable = 0;
      let totalDispensed = 0;
      let totalDigital = 0;
      if (analyticsData) {
        totalAvailable = analyticsData.reduce((sum, a) => sum + (a.total_available || 0), 0);
        totalDispensed = analyticsData.reduce((sum, a) => sum + (a.total_dispensed || 0), 0);
        totalDigital = analyticsData.reduce((sum, a) => sum + (a.digital_dispensed || 0), 0);
      }
      const digitalRate = totalDispensed > 0 ? (totalDigital / totalDispensed) * 100 : 0;

      setDashboardData({
        totalUsers,
        activeUsers,
        totalDrivers,
        totalOperators,
        totalAdmins,
        totalStations,
        verifiedStations,
        pendingStations,
        pendingStationsList,
        inactiveUsersList,
        recentActivities,
        fuelPrices,
        totalReservations: reservationsCount,
        analytics: {
          totalAvailable,
          totalDispensed,
          digitalRate: parseFloat(digitalRate.toFixed(1)),
        },
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-sm text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Helper to format numbers with K/M if needed
  const formatNumber = (num: number) => num.toLocaleString();

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-gray-900 mb-1">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.fullName || 'Admin'}. Here's your system overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', value: dashboardData.totalUsers, icon: Users, color: 'bg-blue-100 text-blue-600', sub: `${dashboardData.activeUsers} active` },
          { label: 'Drivers', value: dashboardData.totalDrivers, icon: UserCheck, color: 'bg-green-100 text-green-600', sub: 'Registered' },
          { label: 'Operators', value: dashboardData.totalOperators, icon: Building2, color: 'bg-orange-100 text-orange-600', sub: `${dashboardData.verifiedStations} verified` },
          { label: 'Reservations', value: dashboardData.totalReservations, icon: Calendar, color: 'bg-purple-100 text-purple-600', sub: 'Total' },
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
                <p className="text-2xl text-green-700">{dashboardData.verifiedStations}</p>
                <p className="text-xs text-gray-500">Verified</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg text-center">
                <p className="text-2xl text-yellow-700">{dashboardData.pendingStations}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
            {dashboardData.pendingStationsList.length > 0 ? (
              <div className="space-y-2">
                {dashboardData.pendingStationsList.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <p className="text-sm text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.address}</p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Pending</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">All stations verified</p>
            )}
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
                <p className="text-xl text-blue-700">{dashboardData.totalDrivers}</p>
                <p className="text-xs text-gray-500">Drivers</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xl text-green-700">{dashboardData.totalOperators}</p>
                <p className="text-xs text-gray-500">Operators</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-xl text-purple-700">{dashboardData.totalAdmins}</p>
                <p className="text-xs text-gray-500">Admins</p>
              </div>
            </div>
            {dashboardData.inactiveUsersList.length > 0 ? (
              <div className="space-y-2">
                {dashboardData.inactiveUsersList.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2">
                      <UserX className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="text-sm text-gray-900">{u.full_name}</p>
                        <p className="text-xs text-gray-500">{u.role} - {u.email}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Inactive</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">No inactive users</p>
            )}
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
              {dashboardData.fuelPrices.length > 0 ? (
                dashboardData.fuelPrices.map(fp => (
                  <div key={fp.name} className="flex-1 p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-lg text-blue-700">ETB {fp.base_price_per_liter.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{fp.name} /L</p>
                  </div>
                ))
              ) : (
                <div className="w-full text-center text-gray-500 text-sm py-2">No fuel prices set</div>
              )}
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
                <p className="text-sm text-green-700">{formatNumber(dashboardData.analytics.totalAvailable)}L</p>
                <p className="text-xs text-gray-500">Available</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-center">
                <p className="text-sm text-blue-700">{formatNumber(dashboardData.analytics.totalDispensed)}L</p>
                <p className="text-xs text-gray-500">Dispensed</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg text-center">
                <p className="text-sm text-purple-700">{dashboardData.analytics.digitalRate}%</p>
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
        {dashboardData.recentActivities.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {dashboardData.recentActivities.map(activity => {
              const typeColors: Record<string, string> = {
                reservation_made: 'bg-blue-100 text-blue-600',
                fuel_updated: 'bg-green-100 text-green-600',
                user_registered: 'bg-purple-100 text-purple-600',
                queue_reported: 'bg-yellow-100 text-yellow-600',
                payment_processed: 'bg-emerald-100 text-emerald-600',
                station_verified: 'bg-orange-100 text-orange-600',
                user_deactivated: 'bg-red-100 text-red-600',
                STATION_CREATED: 'bg-indigo-100 text-indigo-600',
                FUEL_DELIVERY_COMPLETED: 'bg-teal-100 text-teal-600',
              };
              const color = typeColors[activity.action] || typeColors[activity.type] || 'bg-gray-100 text-gray-600';
              return (
                <div key={activity.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      {activity.metadata && (
                        <p className="text-xs text-gray-500 mt-1">
                          {typeof activity.metadata === 'object' ? JSON.stringify(activity.metadata) : activity.metadata}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.user_id ? `By ${activity.user_role || 'User'}` : 'System'} - {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">No recent activity recorded.</div>
        )}
      </div>
    </div>
  );
}