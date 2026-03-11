import { useState } from 'react';
import { mockAdminNotifications } from '../../data/mockData';
import { Notification } from '../../types';
import {
  CheckCircle, AlertTriangle, Bell, Trash2, CheckCheck, Shield, Users
} from 'lucide-react';

export function AdminNotifications() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<Notification[]>(mockAdminNotifications);

  const filteredNotifications = notifications.filter(n => filter === 'unread' ? !n.read : true);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllAsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const deleteNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'system_alert': return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' };
      case 'queue_status': return { icon: Users, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'station_verified': return { icon: Shield, color: 'text-green-600', bg: 'bg-green-100' };
      default: return { icon: Bell, color: 'text-purple-600', bg: 'bg-purple-100' };
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-gray-900 mb-1">Admin Notifications</h1>
        <p className="text-gray-600">System alerts and administrative notifications</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              All ({notifications.length})
            </button>
            <button onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg transition-colors ${filter === 'unread' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Unread ({unreadCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>{filter === 'unread' ? "All caught up!" : 'No notifications'}</p>
          </div>
        ) : (
          filteredNotifications.map(n => {
            const config = getNotificationIcon(n.type);
            const Icon = config.icon;
            return (
              <div key={n.id}
                className={`bg-white rounded-xl p-4 border transition-all hover:shadow-md cursor-pointer ${
                  n.read ? 'border-gray-200' : 'border-purple-300 bg-purple-50'
                }`}
                onClick={() => !n.read && markAsRead(n.id)}>
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-gray-900 text-sm">
                        {n.title}
                        {!n.read && <span className="ml-2 w-2 h-2 bg-purple-600 rounded-full inline-block" />}
                      </h4>
                      <button onClick={e => { e.stopPropagation(); deleteNotification(n.id); }}
                        className="p-1 hover:bg-gray-100 rounded"><Trash2 className="w-4 h-4 text-gray-400" /></button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{n.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{getTimeAgo(n.timestamp)}</span>
                      {n.actionLabel && (
                        <button className="text-sm text-purple-600 hover:text-purple-700">{n.actionLabel} →</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
