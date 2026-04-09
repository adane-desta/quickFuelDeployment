import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { stationService } from '../../lib/supabase/database';
import { notifyError } from '../../lib/utils/notifications';
import type { Station } from '../../types/advanced';
import {
  User, Mail, Phone, MapPin, Building2, FileText, Lock, Shield, Bell, Globe,
  LogOut, Edit2, X, Save, CheckCircle, ChevronRight, Clock
} from 'lucide-react';

interface OperatorProfileProps {
  onLogout: () => void;
}

export function OperatorProfile({ onLogout }: OperatorProfileProps) {
  const { user, updateUser } = useAuth();
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [editData, setEditData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

  const [settings, setSettings] = useState({
    smsNotifications: true,
    pushNotifications: true,
    emailNotifications: true,
    twoFactorAuth: false,
  });

  useEffect(() => {
    if (user) {
      loadStationData();
    }
  }, [user]);

  const loadStationData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const stationData = await stationService.getOperatorStation(user.id);
      setStation(stationData);
    } catch (error) {
      notifyError('Failed to load station data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    updateUser(editData);
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (passwordData.new.length < 6 || passwordData.new !== passwordData.confirm) return;
    setShowChangePassword(false);
    setPasswordData({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-1">Profile</h1>
          <p className="text-gray-600">Manage your account and station settings</p>
        </div>
        <button onClick={() => setIsEditing(!isEditing)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-gray-900">{user?.fullName}</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-sm">
              <Building2 className="w-3 h-3" /> Station Operator
            </span>
            <p className="text-xs text-gray-500 mt-1">Member since {user?.joinedDate}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-green-50 px-4 py-3 border-b border-green-100 flex items-center justify-between">
            <h3 className="text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" /> Personal Information
            </h3>
            {isEditing && (
              <button onClick={handleSave} className="flex items-center gap-1 text-sm text-green-600">
                <Save className="w-4 h-4" /> Save
              </button>
            )}
          </div>
          <div className="p-4 space-y-3">
            {isEditing ? (
              <div className="space-y-3">
                {['fullName', 'email', 'phone', 'address'].map(field => (
                  <div key={field}>
                    <label className="text-xs text-gray-500 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                    <input value={(editData as any)[field]}
                      onChange={e => setEditData({ ...editData, [field]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {[
                  { icon: User, label: 'Full Name', value: user?.fullName },
                  { icon: Mail, label: 'Email', value: user?.email, verified: true },
                  { icon: Phone, label: 'Phone', value: user?.phone, verified: true },
                  { icon: MapPin, label: 'Address', value: user?.address },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="text-gray-900">{item.value || 'Not set'}</p>
                    </div>
                    {item.verified && <CheckCircle className="w-5 h-5 text-green-600" />}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Station Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" /> Station Information
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {[
              { icon: Building2, label: 'Station Name', value: station?.name || 'Not assigned' },
              { icon: MapPin, label: 'Station Location', value: station?.address || 'Not set' },
              { icon: Clock, label: 'Operating Hours', value: station?.is_24_hours ? '24/7' : `${station?.opening_time} - ${station?.closing_time}` || 'Not set' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-gray-900">{item.value || 'Not set'}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Verification Status</p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-600" /> Security
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <button onClick={() => setShowChangePassword(true)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
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
                  onChange={e => setSettings({ ...settings, twoFactorAuth: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
          <button onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
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
                  onChange={e => setPasswordData({ ...passwordData, current: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-gray-600">New Password</label>
                <input type="password" value={passwordData.new}
                  onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Confirm New Password</label>
                <input type="password" value={passwordData.confirm}
                  onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none" />
              </div>
              <button onClick={handleChangePassword}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}