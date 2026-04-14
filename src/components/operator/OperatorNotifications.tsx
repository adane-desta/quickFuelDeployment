import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { notifyError } from '../../lib/utils/notifications';
import { Notification } from '../../types/advanced';
import {
  CheckCircle, XCircle, AlertTriangle, Bell, Trash2, CheckCheck, Shield,
  Calendar, Fuel
} from 'lucide-react';

export function OperatorNotifications() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
        .order('created_at', { ascending: false })
        .limit(50);
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
    if (!user) return;
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reservation': return { icon: Calendar, color: 'text-green-600', bg: 'bg-green-100' };
      case 'fuel_low': return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'fuel_delivery': return { icon: Fuel, color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'station_verified': return { icon: Shield, color: 'text-blue-600', bg: 'bg-blue-100' };
      default: return { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} h ago`;
    return `${diffDays} d ago`;
  };

  const filteredNotifications = notifications.filter(n => filter === 'unread' ? !n.is_read : true);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return <div className="p-4 lg:p-8">Loading notifications...</div>;
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Notifications</h1>
        <p className="text-gray-600">Stay updated with station activity</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>All ({notifications.length})</button>
            <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-lg transition-colors ${filter === 'unread' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Unread ({unreadCount})</button>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
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
              <div key={n.id} className={`bg-white rounded-xl p-4 border transition-all hover:shadow-md cursor-pointer ${n.is_read ? 'border-gray-200' : 'border-green-300 bg-green-50'}`} onClick={() => !n.is_read && markAsRead(n.id)}>
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-gray-900 text-sm">{n.title}{!n.is_read && <span className="ml-2 w-2 h-2 bg-green-600 rounded-full inline-block" />}</h4>
                      <button onClick={e => { e.stopPropagation(); deleteNotification(n.id); }} className="p-1 hover:bg-gray-100 rounded"><Trash2 className="w-4 h-4 text-gray-400" /></button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{n.message}</p>
                    <span className="text-xs text-gray-500">{getTimeAgo(n.created_at)}</span>
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