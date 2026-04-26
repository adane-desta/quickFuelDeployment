import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { UserManagement } from './UserManagement';
import { StationManagement } from './StationManagement';
import { ReservationMonitoring } from './ReservationMonitoring';
import { SystemActivity } from './SystemActivity';
import { AdminNotifications } from './AdminNotifications';
import { AdminProfile } from './AdminProfile';
import { FuelPriceManagement } from './FuelPriceManagement';
import { AddDriverPage } from './AddDriverPage';        
import { CarClassManagement } from './CarClassManagement';
import { SystemAnalytics } from './SystemAnalytics';
import { DeliveryRequestsManagement } from './DeliveryRequestsManagement';
import {
  LayoutDashboard, Users, Building2, Calendar, Activity, Bell, User, LogOut, Menu, X, ShieldCheck, DollarSign, BarChart3, Car, UserPlus, Truck
} from 'lucide-react';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => { logout(); navigate('/login'); };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'fuelprices', label: 'Fuel Prices', icon: DollarSign },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'deliveries', label: 'Fuel Deliveries', icon: Truck },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'stations', label: 'Station Management', icon: Building2 },
    { id: 'reservations', label: 'Reservations', icon: Calendar },
    { id: 'carClass', label: 'Manage Car Class', icon: Car },              
    { id: 'addDriver', label: 'Add Driver', icon: UserPlus },            
    { id: 'activity', label: 'System Activity', icon: Activity },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: 2 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard onNavigate={setActiveTab} />;
      case 'users': return <UserManagement />;
      case 'stations': return <StationManagement />;
      case 'reservations': return <ReservationMonitoring />;
      case 'deliveries': return <DeliveryRequestsManagement />;
      case 'activity': return <SystemActivity />;
      case 'addDriver': return <AddDriverPage />;                 
      case 'carClass': return <CarClassManagement />;
      case 'notifications': return <AdminNotifications />;
      case 'profile': return <AdminProfile onLogout={handleLogout} />;
      case 'fuelprices': return <FuelPriceManagement />;
      case 'analytics': return <SystemAnalytics />;
      default: return <AdminDashboard onNavigate={setActiveTab} />;
    }
  };


  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-gray-900">QuickFuel</h2>
              <p className="text-xs text-gray-500">Admin Portal</p>
            </div>
          </div>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{user.fullName}</p>
              <p className="text-xs text-gray-500 truncate">{user.department || 'Administrator'}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                <Icon className="w-5 h-5" /><span className="text-sm">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" /><span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay – keep exactly as you had */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-gray-900">QuickFuel</h2>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">{user.fullName}</p>
                  <p className="text-xs text-gray-500">Admin</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {sidebarItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}>
                    <Icon className="w-5 h-5" /><span className="text-sm">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-200">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                <LogOut className="w-5 h-5" /><span className="text-sm">Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <div className="lg:hidden bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-purple-500 rounded-full transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-white text-sm">Admin Dashboard</h2>
          </div>
          <button onClick={() => setActiveTab('notifications')} className="p-2 hover:bg-purple-500 rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">2</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden bg-white border-t border-gray-200 px-2 py-2 shadow-lg">
          <div className="flex justify-around items-center">
            {[
              { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'stations', label: 'Stations', icon: Building2 },
              { id: 'activity', label: 'Activity', icon: Activity },
              { id: 'profile', label: 'Profile', icon: User },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:text-gray-900'
                  }`}>
                  <Icon className="w-5 h-5" /><span className="text-xs">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}