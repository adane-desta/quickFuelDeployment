import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { notifyError } from '../../lib/utils/notifications';
import { CheckCircle, XCircle, AlertTriangle, CreditCard, MessageSquare, Trash2, CheckCheck, Fuel, Bell, Calendar, Clock } from 'lucide-react';

export function DriverNotificationsScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      notifyError('Failed to load notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      notifyError('Failed to mark as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      notifyError('Failed to mark all as read', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      notifyError('Failed to delete notification', error);
    }
  };

  const clearAll = async () => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('user_id', user.id);
      if (error) throw error;
      setNotifications([]);
    } catch (error) {
      notifyError('Failed to clear notifications', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reservation': return { icon: Calendar, color: 'text-green-600', bg: 'bg-green-100' };
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
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const filteredNotifications = notifications.filter(n => filter === 'unread' ? !n.is_read : true);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 lg:px-6 py-6 shadow-md">
        <h1 className="text-white mb-2">Notifications</h1>
        <p className="text-blue-100 text-sm">Stay updated with your activity</p>
      </div>

      <div className="bg-white px-4 lg:px-6 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>All ({notifications.length})</button>
            <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-lg transition-colors ${filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Unread ({unreadCount})</button>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"><CheckCheck className="w-4 h-4" /> Mark all read</button>
            )}
          </div>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="bg-gray-50 px-4 lg:px-6 py-2 border-b border-gray-200">
          <button onClick={clearAll} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"><Trash2 className="w-4 h-4" /> Clear all</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
            <CheckCircle className="w-16 h-16 mb-4 text-gray-400" />
            <p className="text-center">{filter === 'unread' ? "You're all caught up!" : 'No notifications yet'}</p>
          </div>
        ) : (
          <div className="p-4 lg:p-6 space-y-2 max-w-3xl">
            {filteredNotifications.map(notification => {
              const config = getNotificationIcon(notification.type);
              const Icon = config.icon;
              return (
                <div key={notification.id} className={`bg-white rounded-xl p-4 border transition-all hover:shadow-md cursor-pointer ${notification.is_read ? 'border-gray-200' : 'border-blue-300 bg-blue-50'}`} onClick={() => !notification.is_read && markAsRead(notification.id)}>
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}><Icon className={`w-5 h-5 ${config.color}`} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-gray-900">{notification.title}{!notification.is_read && <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full inline-block" />}</h4>
                        <button onClick={e => { e.stopPropagation(); deleteNotification(notification.id); }} className="p-1 hover:bg-gray-100 rounded transition-colors"><Trash2 className="w-4 h-4 text-gray-400" /></button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{getTimeAgo(notification.created_at)}</span>
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