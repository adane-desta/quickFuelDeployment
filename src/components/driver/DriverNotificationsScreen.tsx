import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  CreditCard,
  MessageSquare,
  Trash2,
  CheckCheck,
  Fuel,
  Bell
} from 'lucide-react';
import { mockDriverNotifications } from '../../data/mockData';
import { Notification } from '../../types';

export function DriverNotificationsScreen() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<Notification[]>(mockDriverNotifications);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'reservation_confirmed': return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      case 'reservation_cancelled': return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
      case 'queue_status': return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'payment_success': return { icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'feedback_reply': return { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100' };
      case 'fuel_update': return { icon: Fuel, color: 'text-orange-600', bg: 'bg-orange-100' };
      default: return { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 lg:px-6 py-6 shadow-md">
        <h1 className="text-white mb-2">Notifications</h1>
        <p className="text-blue-100 text-sm">Stay updated with your activity</p>
      </div>

      <div className="bg-white px-4 lg:px-6 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg transition-colors relative ${
                filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <CheckCheck className="w-4 h-4" /> Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="bg-gray-50 px-4 lg:px-6 py-2 border-b border-gray-200">
          <button onClick={clearAll} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1">
            <Trash2 className="w-4 h-4" /> Clear all
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
            <CheckCircle className="w-16 h-16 mb-4 text-gray-400" />
            <p className="text-center">
              {filter === 'unread' ? "You're all caught up!" : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="p-4 lg:p-6 space-y-2 max-w-3xl">
            {filteredNotifications.map(notification => {
              const config = getNotificationIcon(notification.type);
              const Icon = config.icon;
              return (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl p-4 border transition-all hover:shadow-md cursor-pointer ${
                    notification.read ? 'border-gray-200' : 'border-blue-300 bg-blue-50'
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-gray-900">
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full inline-block" />
                          )}
                        </h4>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{getTimeAgo(notification.timestamp)}</span>
                        {notification.actionLabel && (
                          <button className="text-sm text-blue-600 hover:text-blue-700">
                            {notification.actionLabel} →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
