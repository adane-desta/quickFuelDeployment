import { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Car, 
  Fuel, 
  CreditCard,
  Lock,
  Shield,
  Bell,
  Globe,
  LogOut,
  Trash2,
  Download,
  Edit2,
  Check,
  X,
  CheckCircle,
  Calendar,
  TrendingUp,
  Heart,
  ChevronRight
} from 'lucide-react';

export function ProfileScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Mock user data
  const [userData, setUserData] = useState({
    fullName: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+251 912 345 678',
    address: 'Bole, Addis Ababa',
    emailVerified: true,
    phoneVerified: true,
    joinedDate: 'March 2024',
    vehicleModel: 'Toyota Corolla 2020',
    plateNumber: 'AA-3-12345',
    preferredFuelType: 'Petrol',
    totalReservations: 24,
    favoriteStation: 'Shell Station Downtown',
  });

  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    smsNotifications: true,
    pushNotifications: true,
    emailNotifications: false,
    language: 'English',
    region: 'Ethiopia',
  });

  const recentReservations = [
    { station: 'Shell Station Downtown', date: '2025-12-11', status: 'completed' },
    { station: 'Total Energy', date: '2025-12-08', status: 'completed' },
    { station: 'BP Express', date: '2025-12-05', status: 'completed' },
    { station: 'ExxonMobil Center', date: '2025-12-02', status: 'completed' },
    { station: 'Gulf Station', date: '2025-11-28', status: 'completed' },
  ];

  const favoriteStations = [
    { name: 'Shell Station Downtown', distance: '0.5 km' },
    { name: 'Total Energy', distance: '2.3 km' },
    { name: 'BP Express', distance: '1.2 km' },
  ];

  const paymentMethods = [
    { type: 'Telebirr', number: '**** **** 5678', default: true },
    { type: 'Chapa', number: '**** **** 1234', default: false },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header with Avatar */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 pt-6 pb-20 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white">Profile</h1>
          <button
            onClick={() => setShowEditModal(true)}
            className="p-2 hover:bg-blue-500 rounded-full transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Profile Card - Overlapping Header */}
      <div className="px-4 -mt-16 pb-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col items-center text-center mb-4">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3 relative">
              <User className="w-12 h-12 text-white" />
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Edit2 className="w-4 h-4 text-blue-600" />
              </button>
            </div>

            <h2 className="text-gray-900 mb-1">{userData.fullName}</h2>
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm mb-2">
              <User className="w-4 h-4" />
              Driver
            </span>
            <p className="text-sm text-gray-500">Member since {userData.joinedDate}</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <p className="text-2xl text-gray-900">{userData.totalReservations}</p>
              </div>
              <p className="text-sm text-gray-500">Total Reservations</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Heart className="w-4 h-4 text-red-600" />
                <p className="text-gray-900 text-sm">{userData.favoriteStation}</p>
              </div>
              <p className="text-sm text-gray-500">Favorite Station</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
            <h3 className="text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Personal Information
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Full Name</p>
                <p className="text-gray-900">{userData.fullName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-gray-900">{userData.email}</p>
              </div>
              {userData.emailVerified && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Phone Number</p>
                <p className="text-gray-900">{userData.phone}</p>
              </div>
              {userData.phoneVerified && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-gray-900">{userData.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-green-50 px-4 py-3 border-b border-green-100">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-green-600" />
              Vehicle Details
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Car className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Vehicle Model</p>
                <p className="text-gray-900">{userData.vehicleModel}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <span className="text-gray-400">#</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Plate Number</p>
                <p className="text-gray-900">{userData.plateNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Fuel className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Preferred Fuel Type</p>
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                  {userData.preferredFuelType}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex items-center justify-between">
            <h3 className="text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              Payment Methods
            </h3>
            <button className="text-sm text-purple-600 hover:text-purple-700">
              Add New
            </button>
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
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Reservation History */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-orange-50 px-4 py-3 border-b border-orange-100 flex items-center justify-between">
            <h3 className="text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Recent Reservations
            </h3>
            <button className="text-sm text-orange-600 hover:text-orange-700">
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {recentReservations.map((reservation, index) => (
              <div key={index} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-gray-900 text-sm">{reservation.station}</p>
                  <p className="text-xs text-gray-500">{reservation.date}</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {reservation.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Favorite Stations */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center justify-between">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600" />
              Favorite Stations
            </h3>
            <button className="text-sm text-red-600 hover:text-red-700">
              Edit
            </button>
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
              <Shield className="w-5 h-5 text-gray-600" />
              Security & Settings
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900">Change Password</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900">Two-Factor Authentication</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.twoFactorAuth}
                  onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-600" />
              Notification Preferences
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-900">SMS Notifications</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.smsNotifications}
                  onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-900">Push Notifications</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-900">Email Notifications</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Language & Region */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-600" />
              Language & Region
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-gray-900">Language</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">{settings.language}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>

            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-gray-900">Region</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">{settings.region}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 space-y-3">
            <button className="w-full flex items-center justify-center gap-2 p-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-5 h-5" />
              Download My Data
            </button>

            <button className="w-full flex items-center justify-center gap-2 p-3 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>

            <button className="w-full flex items-center justify-center gap-2 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="w-5 h-5" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
