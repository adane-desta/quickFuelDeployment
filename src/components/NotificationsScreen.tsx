import { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  MessageSquare, 
  CreditCard,
  Trash2,
  CheckCheck
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'reservation_confirmed' | 'reservation_cancelled' | 'queue_status' | 'payment_success' | 'feedback_reply';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'reservation_confirmed',
    title: 'Reservation Confirmed',
    message: 'Your fuel reservation at Shell Station Downtown for Dec 12, 09:00-10:00 is confirmed. Pickup code: 483920',
    timestamp: '2025-12-11T10:30:00',
    read: false,
    actionLabel: 'View Reservation',
  },
  {
    id: '2',
    type: 'payment_success',
    title: 'Payment Successful',
    message: 'Payment of ETB 1625 via Telebirr was successful for your reservation at Shell Station Downtown.',
    timestamp: '2025-12-11T10:28:00',
    read: false,
    actionLabel: 'View Receipt',
  },
  {
    id: '3',
    type: 'queue_status',
    title: 'Queue Status Changed',
    message: 'BP Express queue status changed from Medium to Short. Great time to visit!',
    timestamp: '2025-12-11T09:15:00',
    read: true,
    actionLabel: 'View Station',
  },
  {
    id: '4',
    type: 'feedback_reply',
    title: 'Reply from Admin',
    message: 'Thank you for your feedback regarding Total Energy station. We have forwarded your concerns to the operator.',
    timestamp: '2025-12-10T16:45:00',
    read: true,
    actionLabel: 'View Feedback',
  },
  {
    id: '5',
    type: 'reservation_cancelled',
    title: 'Reservation Cancelled',
    message: 'Your reservation at BP Express for Dec 10 has been cancelled. Refund will be processed within 3-5 business days.',
    timestamp: '2025-12-10T14:20:00',
    read: true,
  },
  {
    id: '6',
    type: 'queue_status',
    title: 'Long Queue Alert',
    message: 'Chevron Plus currently has a long queue (25+ min wait). Consider visiting later or choose a nearby station.',
    timestamp: '2025-12-10T11:30:00',
    read: true,
    actionLabel: 'Find Alternatives',
  },
];

export function NotificationsScreen() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState(mockNotifications);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'reservation_confirmed':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      case 'reservation_cancelled':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
      case 'queue_status':
        return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'payment_success':
        return { icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'feedback_reply':
        return { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100' };
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMs = now.getTime() - time.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins} min ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-6 shadow-md">
        <h1 className="text-white mb-2">Notifications</h1>
        <p className="text-blue-100 text-sm">Stay updated with your activity</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg transition-colors relative ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread ({unreadCount})
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {notifications.length > 0 && (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all read
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions Bar */}
      {notifications.length > 0 && (
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <button
            onClick={clearAll}
            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Clear all notifications
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
            <CheckCircle className="w-16 h-16 mb-4 text-gray-400" />
            <p className="text-center">
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredNotifications.map((notification) => {
              const config = getNotificationIcon(notification.type);
              const Icon = config.icon;

              return (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl p-4 border transition-all hover:shadow-md ${
                    notification.read 
                      ? 'border-gray-200' 
                      : 'border-blue-300 bg-blue-50'
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-gray-900">
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
                          )}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>

                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(notification.timestamp)}
                        </span>

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
