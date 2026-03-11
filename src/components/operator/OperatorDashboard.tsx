import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockStations, mockReservations } from '../../data/mockData';
import {
  Fuel, Droplets, Users, Calendar, Clock, TrendingUp, AlertTriangle, CheckCircle,
  ArrowRight, QrCode, Bell
} from 'lucide-react';

interface OperatorDashboardProps {
  onNavigate: (tab: string) => void;
}

export function OperatorDashboard({ onNavigate }: OperatorDashboardProps) {
  const { user } = useAuth();
  const station = mockStations.find(s => s.id === user?.stationId) || mockStations[0];
  const stationReservations = mockReservations.filter(r => r.stationId === station.id);
  const todayReservations = stationReservations.filter(r => r.date === '2026-02-16');
  const confirmedCount = stationReservations.filter(r => r.status === 'confirmed').length;
  const completedToday = todayReservations.filter(r => r.status === 'completed').length;

  const queueColors = {
    Short: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    Medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    Long: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-gray-900 mb-1">Welcome, {user?.fullName?.split(' ')[0]}</h1>
        <p className="text-gray-600">{station.name} - {station.address || 'Addis Ababa'}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl text-gray-900">{todayReservations.length}</p>
          </div>
          <p className="text-sm text-gray-500">Today's Reservations</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl text-gray-900">{confirmedCount}</p>
          </div>
          <p className="text-sm text-gray-500">Pending Pickups</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Droplets className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl text-gray-900">{((station.petrolStock || 0) / 1000).toFixed(1)}K</p>
          </div>
          <p className="text-sm text-gray-500">Petrol Stock (L)</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Droplets className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl text-gray-900">{((station.dieselStock || 0) / 1000).toFixed(1)}K</p>
          </div>
          <p className="text-sm text-gray-500">Diesel Stock (L)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Station Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-green-50 px-4 py-3 border-b border-green-100 flex items-center justify-between">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Fuel className="w-5 h-5 text-green-600" /> Station Status
            </h3>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${queueColors[station.queueLength].bg} ${queueColors[station.queueLength].text}`}>
              <span className={`w-2 h-2 rounded-full ${queueColors[station.queueLength].dot} animate-pulse`} />
              {station.queueLength} Queue
            </span>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Petrol</p>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${station.petrolAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-gray-900">{station.petrolAvailable ? 'Available' : 'Unavailable'}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{(station.petrolStock || 0).toLocaleString()} L</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Diesel</p>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${station.dieselAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-gray-900">{station.dieselAvailable ? 'Available' : 'Unavailable'}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{(station.dieselStock || 0).toLocaleString()} L</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Operating Hours: {station.operatingHours || '06:00 - 22:00'}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onNavigate('fuel')}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                <Droplets className="w-4 h-4" /> Update Fuel
              </button>
              <button onClick={() => onNavigate('queue')}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <Users className="w-4 h-4" /> Update Queue
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming Reservations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center justify-between">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Upcoming Pickups
            </h3>
            <button onClick={() => onNavigate('reservations')} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {stationReservations.filter(r => r.status === 'confirmed').slice(0, 4).map(res => (
              <div key={res.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-gray-900 text-sm">{res.driverName}</p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{res.pickupCode}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{res.timeSlot}</span>
                  <span>{res.fuelType} - {res.quantity}L</span>
                  <span>{res.plateNumber}</span>
                </div>
              </div>
            ))}
            {stationReservations.filter(r => r.status === 'confirmed').length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No pending pickups</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button onClick={() => onNavigate('verify')}
              className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 hover:shadow-md transition-all text-center">
              <QrCode className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-900">Verify Pickup</p>
              <p className="text-xs text-gray-500">Scan or enter code</p>
            </button>
            <button onClick={() => onNavigate('fuel')}
              className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-md transition-all text-center">
              <Droplets className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-900">Update Fuel</p>
              <p className="text-xs text-gray-500">Stock & availability</p>
            </button>
            <button onClick={() => onNavigate('queue')}
              className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200 hover:shadow-md transition-all text-center">
              <Users className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-gray-900">Update Queue</p>
              <p className="text-xs text-gray-500">Queue status</p>
            </button>
            <button onClick={() => onNavigate('notifications')}
              className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:shadow-md transition-all text-center">
              <Bell className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-900">Notifications</p>
              <p className="text-xs text-gray-500">2 unread</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
