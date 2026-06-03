import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  User, Mail, Phone, MapPin, Car, Fuel, CreditCard, Lock, Shield, Bell, Globe,
  LogOut, Trash2, Download, Edit2, Check, X, CheckCircle, Calendar, TrendingUp,
  Heart, ChevronRight, Save, Gauge, AlertCircle
} from 'lucide-react';

interface DriverProfileScreenProps {
  onLogout: () => void;
}

interface ReservationCount {
  total: number;
  completed: number;
}

interface CarClassInfo {
  name: string;
  weekly_fuel_limit: number;
}

export function DriverProfileScreen({ onLogout }: DriverProfileScreenProps) {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [reservationStats, setReservationStats] = useState<ReservationCount>({ total: 0, completed: 0 });
  const [carClass, setCarClass] = useState<CarClassInfo | null>(null);
  const [weeklyUsed, setWeeklyUsed] = useState<number>(0);
  const [weeklyRemaining, setWeeklyRemaining] = useState<number>(0);
  const [weeklyResetDate, setWeeklyResetDate] = useState<string>('');
  const [loadingStats, setLoadingStats] = useState(true);
  const [favoriteStations, setFavoriteStations] = useState<{ name: string; distance: string }[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{ type: string; number: string; default: boolean }[]>([]);

  const [editData, setEditData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    vehicle_model: user?.vehicle_model || '',
    plate_number: user?.plate_number || '',
    preferred_fuel_type: user?.preferred_fuel_type || 'Petrol',
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    smsNotifications: true,
    pushNotifications: true,
    emailNotifications: false,
    language: 'English',
  });

  // Fetch driver stats from Supabase
  useEffect(() => {
    if (!user?.id) return;

    const fetchDriverData = async () => {
      setLoadingStats(true);
      try {
        // 1. Get reservation counts
        const { data: reservations, error: resError } = await supabase
          .from('reservations')
          .select('status')
          .eq('driver_id', user.id);
        if (!resError && reservations) {
          const total = reservations.length;
          const completed = reservations.filter(r => r.status === 'completed').length;
          setReservationStats({ total, completed });
        }

        // 2. Get car class info and weekly quota
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('car_class_id, weekly_reserved_liters, weekly_reset_date')
          .eq('id', user.id)
          .single();
        if (!userError && userData) {
          setWeeklyUsed(userData.weekly_reserved_liters || 0);
          setWeeklyResetDate(userData.weekly_reset_date || new Date().toISOString().split('T')[0]);

          if (userData.car_class_id) {
            const { data: classData, error: classError } = await supabase
              .from('car_classes')
              .select('name, weekly_fuel_limit')
              .eq('id', userData.car_class_id)
              .single();
            if (!classError && classData) {
              setCarClass(classData);
              const limit = classData.weekly_fuel_limit;
              const used = userData.weekly_reserved_liters || 0;
              setWeeklyRemaining(Math.max(0, limit - used));
            }
          }
        }

        // 3. Favorite stations (mock for now – you can replace with real data from a favorites table)
        setFavoriteStations([
          { name: 'Shell Station Downtown', distance: '0.5 km' },
          { name: 'Total Energy', distance: '2.3 km' },
          { name: 'BP Express', distance: '1.2 km' },
        ]);

        // 4. Payment methods (mock)
        setPaymentMethods([
          { type: 'Telebirr', number: '**** **** 5678', default: true },
          { type: 'Chapa', number: '**** **** 1234', default: false },
        ]);
      } catch (err) {
        console.error('Error fetching driver data:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDriverData();
  }, [user?.id]);

  const handleSaveProfile = () => {
    updateUser(editData);
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (passwordData.new.length < 6) return;
    if (passwordData.new !== passwordData.confirm) return;
    // Implement actual password change via Supabase
    setShowChangePassword(false);
    setPasswordData({ current: '', new: '', confirm: '' });
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Not set';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 lg:px-6 pt-6 pb-20 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 hover:bg-blue-500 rounded-full transition-colors"
          >
            {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="px-4 lg:px-6 -mt-16 pb-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3">
              <User className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{user?.full_name}</h2>
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm mb-2">
              <User className="w-4 h-4" /> Driver
            </span>
            <p className="text-sm text-gray-500">
              Member since {user?.created_at ? formatDate(user.created_at) : 'N/A'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <p className="text-2xl font-bold text-gray-900">{reservationStats.total}</p>
              </div>
              <p className="text-sm text-gray-500">Total Reservations</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-2xl font-bold text-gray-900">{reservationStats.completed}</p>
              </div>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content - increased max height and proper margins */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 space-y-4 pb-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Fuel Quota Card - NEW */}
          {!loadingStats && carClass && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-sm p-5 border border-amber-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-900 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-amber-600" /> Weekly Fuel Quota
                </h3>
                <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">{carClass.name}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Used this week</span>
                  <span className="font-semibold text-gray-900">{weeklyUsed.toLocaleString()} L</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remaining</span>
                  <span className="font-semibold text-green-700">{weeklyRemaining.toLocaleString()} L</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Weekly Limit</span>
                  <span className="font-semibold text-gray-900">{carClass.weekly_fuel_limit.toLocaleString()} L</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((weeklyUsed / carClass.weekly_fuel_limit) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Resets on {weeklyResetDate ? formatDate(weeklyResetDate) : 'Monday'}
                </p>
              </div>
            </div>
          )}

          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-50 px-5 py-3 border-b border-blue-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" /> Personal Information
              </h3>
              {isEditing && (
                <button onClick={handleSaveProfile} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                  <Save className="w-4 h-4" /> Save
                </button>
              )}
            </div>
            <div className="p-5 space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Full Name</label>
                    <input
                      value={editData.full_name}
                      onChange={e => setEditData({ ...editData, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input
                      value={editData.email}
                      onChange={e => setEditData({ ...editData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone</label>
                    <input
                      value={editData.phone}
                      onChange={e => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Address</label>
                    <input
                      value={editData.address}
                      onChange={e => setEditData({ ...editData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Full Name</p>
                      <p className="font-medium text-gray-900">{user?.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{user?.email}</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{user?.phone}</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="font-medium text-gray-900">{user?.address || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-green-50 px-5 py-3 border-b border-green-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-green-600" /> Vehicle Details
              </h3>
            </div>
            <div className="p-5 space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Vehicle Model</label>
                    <input
                      value={editData.vehicle_model}
                      onChange={e => setEditData({ ...editData, vehicle_model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Plate Number</label>
                    <input
                      value={editData.plate_number}
                      onChange={e => setEditData({ ...editData, plate_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Preferred Fuel</label>
                    <div className="flex gap-2">
                      {(['Petrol', 'Diesel'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setEditData({ ...editData, preferred_fuel_type: f })}
                          className={`flex-1 py-2 rounded-lg border-2 transition-colors ${
                            editData.preferred_fuel_type === f
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Vehicle Model</p>
                      <p className="font-medium text-gray-900">{user?.vehicle_model || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">#</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Plate Number</p>
                      <p className="font-medium text-gray-900">{user?.plate_number || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Fuel className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Preferred Fuel Type</p>
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                        {user?.preferred_fuel_type || 'Petrol'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-purple-50 px-5 py-3 border-b border-purple-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" /> Payment Methods
              </h3>
              <button className="text-sm text-purple-600 hover:text-purple-700">Add New</button>
            </div>
            <div className="p-5 space-y-3">
              {paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{method.type}</p>
                    <p className="text-sm text-gray-500">{method.number}</p>
                  </div>
                  {method.default && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Default</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Favorite Stations */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-red-50 px-5 py-3 border-b border-red-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" /> Favorite Stations
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {favoriteStations.map((station, index) => (
                <div key={index} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{station.name}</p>
                      <p className="text-xs text-gray-500">{station.distance} away</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-100 px-5 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-gray-600" /> Security & Settings
              </h3>
            </div>
            <div className="p-5 space-y-3">
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Change Password</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Two-Factor Auth</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.twoFactorAuth}
                    onChange={e => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-100 px-5 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-gray-600" /> Notification Preferences
              </h3>
            </div>
            <div className="p-5 space-y-3">
              {[
                { key: 'smsNotifications', label: 'SMS Notifications' },
                { key: 'pushNotifications', label: 'Push Notifications' },
                { key: 'emailNotifications', label: 'Email Notifications' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">{item.label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(settings as any)[item.key]}
                      onChange={e => setSettings({ ...settings, [item.key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 space-y-3">
              <button className="w-full flex items-center justify-center gap-2 p-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-5 h-5" /> Download My Data
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
              <button className="w-full flex items-center justify-center gap-2 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-5 h-5" /> Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
              <button onClick={() => setShowChangePassword(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Current Password</label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={e => setPasswordData({ ...passwordData, current: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">New Password</label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleChangePassword}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}