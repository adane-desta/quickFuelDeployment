import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { OwnerDashboard } from './OwnerDashboard';
import { OperatorManagementPage } from './OperatorManagementPage';
import { DeliveryRequestsPage } from './DeliveryRequestsPage';
import { StationSettingsPage } from './StationSettingsPage';
import { OwnerNotifications } from './OwnerNotifications';
import { OwnerProfile } from './OwnerProfile';
import { FuelManagementOwner } from './FuelManagementOwner';
import { RefundRequests } from './RefundRequests';
import { OwnerAnalytics } from './OwnerAnalytics';
import { FuelDeliveryRequest } from './FuelDeliveryRequest';
import {
  Fuel, LayoutDashboard, Users, Truck, Settings, Bell, User, LogOut, Menu, X, Building2, BarChart3, DollarSign
} from 'lucide-react';

export function OwnerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) { navigate('/login'); return null; }

  const handleLogout = () => { logout(); navigate('/login'); };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard & Analytics', icon: LayoutDashboard },
    { id: 'fuel', label: 'Fuel Stock', icon: Fuel },
    { id: 'operators', label: 'Manage Operators', icon: Users },
    { id: 'deliveries', label: 'Fuel Deliveries', icon: Truck },
    { id: 'refunds', label: 'Refund Requests', icon: DollarSign },
    { id: 'settings', label: 'Station Settings', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: 2 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <OwnerDashboard onNavigate={setActiveTab} />;
      case 'operators': return <OperatorManagementPage />;
      case 'deliveries': return <FuelDeliveryRequest />;
      case 'fuel': return <FuelManagementOwner />;
      case 'settings': return <StationSettingsPage />;
      case 'refunds': return <RefundRequests />;
      case 'analytics': return <OwnerAnalytics />;
      case 'notifications': return <OwnerNotifications />;
      case 'profile': return <OwnerProfile onLogout={handleLogout} />;
      default: return <OwnerDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-gray-900">QuickFuel</h2>
              <p className="text-xs text-gray-500">Owner Portal</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{user.fullName}</p>
              <p className="text-xs text-gray-500 truncate">{user.stationName || 'Station Owner'}</p>
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
                  isActive ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
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

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-gray-900">QuickFuel</h2>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">{user.fullName}</p>
                  <p className="text-xs text-gray-500">Owner</p>
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
                      isActive ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50'
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
        <div className="lg:hidden bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-orange-500 rounded-full transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-white text-sm">{user.stationName || 'Station Owner'}</h2>
          </div>
          <button onClick={() => setActiveTab('notifications')} className="p-2 hover:bg-orange-500 rounded-full transition-colors relative">
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
              { id: 'operators', label: 'Staff', icon: Users },
              { id: 'deliveries', label: 'Delivery', icon: Truck },
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'profile', label: 'Profile', icon: User },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-gray-900'
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
