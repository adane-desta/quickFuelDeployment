import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { SearchBar } from '../SearchBar';
import { QuickActions } from '../QuickActions';
import { ListView } from '../ListView';
import { MapView } from '../MapView';
import { BottomNav } from '../BottomNav';
import { ReservationFlow } from '../ReservationFlow';
import { DriverReservationsScreen } from './DriverReservationsScreen';
import { DriverNotificationsScreen } from './DriverNotificationsScreen';
import { DriverProfileScreen } from './DriverProfileScreen';
import { ReportQueueModal } from './ReportQueueModal';
import { Bell, Home, Calendar, User, Fuel, MapPin, LogOut, Heart, Settings, Menu, X } from 'lucide-react';
import { mockStations } from '../../data/mockData';
import { Station } from '../../types';

export function DriverLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [stations, setStations] = useState<Station[]>(mockStations);
  const [activeTab, setActiveTab] = useState('home');
  const [notificationCount] = useState(2);
  const [selectedStationForReservation, setSelectedStationForReservation] = useState<Station | null>(null);
  const [showReportQueue, setShowReportQueue] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleRefresh = () => {
    const shuffled = [...mockStations].sort(() => Math.random() - 0.5);
    setStations(shuffled);
  };

  const filteredStations = stations.filter(station => {
    const query = searchQuery.toLowerCase();
    return (
      station.name.toLowerCase().includes(query) ||
      (station.address || '').toLowerCase().includes(query) ||
      (query.includes('petrol') && station.petrolAvailable) ||
      (query.includes('diesel') && station.dieselAvailable)
    );
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'reservations', label: 'My Reservations', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: notificationCount },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 lg:px-6 py-4 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 hover:bg-blue-500 rounded-full transition-colors"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-white">QuickFuel</h1>
                    <p className="text-blue-100 text-sm">Welcome, {user.fullName?.split(' ')[0]}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className="relative p-2 hover:bg-blue-500 rounded-full transition-colors"
                >
                  <Bell className="w-6 h-6" />
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                      {notificationCount}
                    </span>
                  )}
                </button>
              </div>

              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>

            {/* Quick Actions */}
            <QuickActions
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onRefresh={handleRefresh}
              onReportQueue={() => setShowReportQueue(true)}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
              {viewMode === 'list' ? (
                <ListView
                  stations={filteredStations}
                  onReserve={setSelectedStationForReservation}
                />
              ) : (
                <MapView
                  stations={filteredStations}
                  onReserve={setSelectedStationForReservation}
                />
              )}
            </div>
          </>
        );
      case 'reservations':
        return <DriverReservationsScreen />;
      case 'notifications':
        return <DriverNotificationsScreen />;
      case 'profile':
        return <DriverProfileScreen onLogout={handleLogout} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
              <Fuel className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-gray-900">QuickFuel</h2>
              <p className="text-xs text-gray-500">Driver Portal</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{user.fullName}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                  <Fuel className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-gray-900">QuickFuel</h2>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">{user.fullName}</p>
                  <p className="text-xs text-gray-500">Driver</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {sidebarItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderContent()}
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <div className="lg:hidden">
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Reservation Flow Modal */}
      {selectedStationForReservation && (
        <ReservationFlow
          station={selectedStationForReservation}
          onClose={() => setSelectedStationForReservation(null)}
        />
      )}

      {/* Report Queue Modal */}
      {showReportQueue && (
        <ReportQueueModal
          stations={mockStations}
          onClose={() => setShowReportQueue(false)}
        />
      )}
    </div>
  );
}
