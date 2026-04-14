import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  User, Mail, Phone, MapPin, Car, Fuel, CreditCard, Lock, Shield, Bell, Globe,
  LogOut, Trash2, Download, Edit2, Check, X, CheckCircle, Calendar, TrendingUp,
  Heart, ChevronRight, Save
} from 'lucide-react';

interface DriverProfileScreenProps {
  onLogout: () => void;
}

export function DriverProfileScreen({ onLogout }: DriverProfileScreenProps) {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

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

  const favoriteStations = [
    { name: 'Shell Station Downtown', distance: '0.5 km' },
    { name: 'Total Energy', distance: '2.3 km' },
    { name: 'BP Express', distance: '1.2 km' },
  ];

  const paymentMethods = [
    { type: 'Telebirr', number: '**** **** 5678', default: true },
    { type: 'Chapa', number: '**** **** 1234', default: false },
  ];

  const handleSaveProfile = () => {
    updateUser(editData);
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (passwordData.new.length < 6) return;
    if (passwordData.new !== passwordData.confirm) return;
    // Simulate password change
    setShowChangePassword(false);
    setPasswordData({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 lg:px-6 pt-6 pb-20 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white">Profile</h1>
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
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3">
              <User className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-gray-900 mb-1">{user?.full_name}</h2>
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm mb-2">
              <User className="w-4 h-4" /> Driver
            </span>
            <p className="text-sm text-gray-500">Member since {user?.joinedDate}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <p className="text-2xl text-gray-900">24</p>
              </div>
              <p className="text-sm text-gray-500">Total Reservations</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Heart className="w-4 h-4 text-red-600" />
                <p className="text-gray-900 text-sm">Shell Station Downtown</p>
              </div>
              <p className="text-sm text-gray-500">Favorite Station</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 space-y-4 pb-4">
        <div className="max-w-2xl space-y-4">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center justify-between">
              <h3 className="text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" /> Personal Information
              </h3>
              {isEditing && (
                <button onClick={handleSaveProfile} className="flex items-center gap-1 text-sm text-blue-600">
                  <Save className="w-4 h-4" /> Save
                </button>
              )}
            </div>
            <div className="p-4 space-y-3">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Full Name</label>
                    <input value={editData.full_name} onChange={e => setEditData({...editData, full_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Email</label>
                    <input value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Phone</label>
                    <input value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Address</label>
                    <input value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Full Name</p>
                      <p className="text-gray-900">{user?.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-gray-900">{user?.email}</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-gray-900">{user?.phone}</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-gray-900">{user?.address}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-green-50 px-4 py-3 border-b border-green-100">
              <h3 className="text-gray-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-green-600" /> Vehicle Details
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Vehicle Model</label>
                    <input value={editData.vehicle_model} onChange={e => setEditData({...editData, vehicle_model: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Plate Number</label>
                    <input value={editData.plate_number} onChange={e => setEditData({...editData, plate_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Preferred Fuel</label>
                    <div className="flex gap-2">
                      {(['Petrol', 'Diesel'] as const).map(f => (
                        <button key={f} onClick={() => setEditData({...editData, preferred_fuel_type: f})}
                          className={`flex-1 py-2 rounded-lg border-2 transition-colors ${
                            editData.preferred_fuel_type === f ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                          }`}>{f}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Vehicle Model</p>
                      <p className="text-gray-900">{user?.vehicle_model || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center"><span className="text-gray-400">#</span></div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Plate Number</p>
                      <p className="text-gray-900">{user?.plate_number || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Fuel className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Preferred Fuel Type</p>
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                        {user?.preferred_fuel_type || 'Petrol'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex items-center justify-between">
              <h3 className="text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" /> Payment Methods
              </h3>
              <button className="text-sm text-purple-600 hover:text-purple-700">Add New</button>
            </div>
            <div className="p-4 space-y-3">
              {paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-gray-900">{method.type}</p>
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
            <div className="bg-red-50 px-4 py-3 border-b border-red-100">
              <h3 className="text-gray-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" /> Favorite Stations
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {favoriteStations.map((station, index) => (
                <div key={index} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-900 text-sm">{station.name}</p>
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
            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
              <h3 className="text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-gray-600" /> Security & Settings
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">Change Password</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">Two-Factor Auth</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.twoFactorAuth}
                    onChange={e => setSettings({...settings, twoFactorAuth: e.target.checked})} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
              <h3 className="text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-gray-600" /> Notification Preferences
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {[
                { key: 'smsNotifications', label: 'SMS Notifications' },
                { key: 'pushNotifications', label: 'Push Notifications' },
                { key: 'emailNotifications', label: 'Email Notifications' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">{item.label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={(settings as any)[item.key]}
                      onChange={e => setSettings({...settings, [item.key]: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 space-y-3">
              <button className="w-full flex items-center justify-center gap-2 p-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-5 h-5" /> Download My Data
              </button>
              <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
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
              <h3 className="text-gray-900">Change Password</h3>
              <button onClick={() => setShowChangePassword(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Current Password</label>
                <input type="password" value={passwordData.current}
                  onChange={e => setPasswordData({...passwordData, current: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-gray-600">New Password</label>
                <input type="password" value={passwordData.new}
                  onChange={e => setPasswordData({...passwordData, new: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Confirm New Password</label>
                <input type="password" value={passwordData.confirm}
                  onChange={e => setPasswordData({...passwordData, confirm: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
              </div>
              <button onClick={handleChangePassword}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
