import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { db } from '../../lib/supabase/services';
import { User as UserType } from '../../types';
import {
  Users, Search, User, Building2, ShieldCheck, CheckCircle, XCircle, Eye, UserX, UserCheck,
  Mail, Phone, Car, Loader2, X, Filter
} from 'lucide-react';

export function UserManagement() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'driver' | 'operator' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [stationsMap, setStationsMap] = useState<Map<string, string>>(new Map());

  // Load all users and station names for operators
  useEffect(() => {
    loadUsersAndStations();
  }, []);

  const loadUsersAndStations = async () => {
    setLoading(true);
    try {
      // Fetch all stations (id -> name) for mapping operator station names
      const { data: stations } = await supabase
        .from('stations')
        .select('id, name');
      const stationMap = new Map<string, string>();
      stations?.forEach(s => stationMap.set(s.id, s.name));
      setStationsMap(stationMap);

      // Fetch all users
      const usersData = await db.users.getAll();
      // Transform to match the User interface expected by the component
      const transformedUsers = usersData.map(u => ({
        ...u,
        fullName: u.full_name,
        isActive: u.is_active,
        joinedDate: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Unknown',
        address: u.address,
        vehicleModel: u.vehicle_model,
        plateNumber: u.plate_number,
        licenseNumber: u.license_number,
        preferredFuelType: u.preferred_fuel_type,
        stationName: u.station_id ? stationMap.get(u.station_id) || 'Unknown Station' : undefined,
        businessLicense: u.business_license_number,
        employeeId: u.employee_id,
        department: u.department,
      }));
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      // Optionally show a toast error
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(u => {
    const matchesSearch = !search ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleToggleActive = async (id: string) => {
    setToggling(id);
    try {
      const currentUser = users.find(u => u.id === id);
      if (!currentUser) return;

      const newActiveStatus = !currentUser.isActive;
      const updated = await db.users.update(id, { is_active: newActiveStatus });
      if (updated) {
        setUsers(prev => prev.map(u =>
          u.id === id ? { ...u, isActive: newActiveStatus } : u
        ));
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    } finally {
      setToggling(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'driver': return User;
      case 'operator': return Building2;
      case 'admin': return ShieldCheck;
      default: return User;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'driver': return 'bg-blue-100 text-blue-700';
      case 'operator': return 'bg-green-100 text-green-700';
      case 'admin': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-sm text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-gray-900 mb-1">User Management</h1>
        <p className="text-gray-600">Manage all users across the QuickFuel platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', value: users.length, color: 'bg-blue-100 text-blue-600' },
          { label: 'Drivers', value: users.filter(u => u.role === 'driver').length, color: 'bg-green-100 text-green-600' },
          { label: 'Operators', value: users.filter(u => u.role === 'operator').length, color: 'bg-orange-100 text-orange-600' },
          { label: 'Station owners', value: users.filter(u => u.role === 'station_owner').length, color: 'bg-orange-100 text-orange-600' },
          { label: 'Active', value: users.filter(u => u.isActive).length, color: 'bg-emerald-100 text-emerald-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-2xl text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'driver', 'operator', 'station_owner' , 'admin'] as const).map(r => {
            const count = r === 'all' ? users.length : users.filter(u => u.role === r).length;
            return (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors text-sm ${
                  roleFilter === r ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}s ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* No users message */}
      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No users found</p>
        </div>
      )}

      {/* Users Table (Desktop) */}
      {filtered.length > 0 && (
        <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm text-gray-600">User</th>
                <th className="text-left px-4 py-3 text-sm text-gray-600">Role</th>
                <th className="text-left px-4 py-3 text-sm text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 text-sm text-gray-600">Joined</th>
                <th className="text-left px-4 py-3 text-sm text-gray-600">Status</th>
                <th className="text-left px-4 py-3 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map(u => {
                const RoleIcon = getRoleIcon(u.role);
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">{u.fullName}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getRoleColor(u.role)}`}>
                        <RoleIcon className="w-3 h-3" /> {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.joinedDate}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {u.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u.id)}
                          disabled={toggling === u.id}
                          className={`p-1.5 rounded transition-colors ${
                            u.isActive ? 'hover:bg-red-50' : 'hover:bg-green-50'
                          }`}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {toggling === u.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : u.isActive ? (
                            <UserX className="w-4 h-4 text-red-500" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-green-500" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Users Cards (Mobile) */}
      <div className="lg:hidden space-y-3">
        {filtered.map(u => {
          const RoleIcon = getRoleIcon(u.role);
          return (
            <div key={u.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-gray-900">{u.fullName}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {u.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getRoleColor(u.role)}`}>
                  <RoleIcon className="w-3 h-3" /> {u.role}
                </span>
                <span className="text-xs text-gray-500">{u.phone}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedUser(u)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-4 h-4" /> View
                </button>
                <button
                  onClick={() => handleToggleActive(u.id)}
                  disabled={toggling === u.id}
                  className={`flex-1 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1 ${
                    u.isActive
                      ? 'border border-red-200 text-red-600 hover:bg-red-50'
                      : 'border border-green-200 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {toggling === u.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : u.isActive ? (
                    <><UserX className="w-4 h-4" /> Deactivate</>
                  ) : (
                    <><UserCheck className="w-4 h-4" /> Activate</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-gray-900">User Details</h3>
                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-8 h-8 text-gray-500" />
                </div>
                <h4 className="text-gray-900">{selectedUser.fullName}</h4>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs mt-1 ${getRoleColor(selectedUser.role)}`}>
                  {selectedUser.role}
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { icon: Mail, label: 'Email', value: selectedUser.email },
                  { icon: Phone, label: 'Phone', value: selectedUser.phone },
                  { icon: User, label: 'Address', value: selectedUser.address },
                  { icon: User, label: 'Joined', value: selectedUser.joinedDate },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="text-gray-900 text-sm">{item.value || 'Not set'}</p>
                    </div>
                  </div>
                ))}

                {selectedUser.role === 'driver' && (
                  <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs text-blue-800">Driver Details</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="w-4 h-4 text-blue-500" />
                      <span>{selectedUser.vehicleModel || 'N/A'}</span>
                    </div>
                    <p className="text-sm text-gray-700">Plate: {selectedUser.plateNumber || 'N/A'}</p>
                    <p className="text-sm text-gray-700">License: {selectedUser.licenseNumber || 'N/A'}</p>
                    <p className="text-sm text-gray-700">Fuel: {selectedUser.preferredFuelType || 'N/A'}</p>
                  </div>
                )}

                {selectedUser.role === 'operator' && (
                  <div className="bg-green-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs text-green-800">Operator Details</p>
                    <p className="text-sm text-gray-700">Station: {selectedUser.stationName || 'N/A'}</p>
                    <p className="text-sm text-gray-700">License: {selectedUser.businessLicense || 'N/A'}</p>
                  </div>
                )}

                {selectedUser.role === 'admin' && (
                  <div className="bg-purple-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs text-purple-800">Admin Details</p>
                    <p className="text-sm text-gray-700">Employee ID: {selectedUser.employeeId || 'N/A'}</p>
                    <p className="text-sm text-gray-700">Department: {selectedUser.department || 'N/A'}</p>
                  </div>
                )}

                <div className="pt-3 flex gap-2">
                  <button
                    onClick={() => {
                      handleToggleActive(selectedUser.id);
                      setSelectedUser(null);
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm ${
                      selectedUser.isActive
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {selectedUser.isActive ? 'Deactivate User' : 'Activate User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}