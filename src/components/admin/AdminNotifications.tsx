import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  CheckCircle, AlertTriangle, Bell, Trash2, CheckCheck, Shield, Users, Loader2
} from 'lucide-react';
import { Card } from '../ui/card';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  related_id: string | null;
  related_type: string | null;
}

export function AdminNotifications() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // For admin, fetch all notifications (or you can filter by user_id = admin's id)
      // Here we fetch all notifications (system-wide). If you want only admin-specific,
      // add .eq('user_id', user.id)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
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
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('is_read', false);
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system_alert':
      case 'system':
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' };
      case 'queue_status':
        return { icon: Users, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'station_verified':
      case 'STATION_CREATED':
        return { icon: Shield, color: 'text-green-600', bg: 'bg-green-100' };
      case 'fuel_low':
      case 'fuel_delivery':
      case 'reservation':
        return { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-100' };
      default:
        return { icon: Bell, color: 'text-purple-600', bg: 'bg-purple-100' };
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

  const filteredNotifications = notifications.filter(n => filter === 'unread' ? !n.is_read : true);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Admin Notifications</h1>
        <p className="text-gray-600">System alerts and administrative notifications</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'unread' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
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
          <Card className="p-12 text-center text-gray-500">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>{filter === 'unread' ? "All caught up!" : 'No notifications'}</p>
          </Card>
        ) : (
          filteredNotifications.map(notif => {
            const config = getNotificationIcon(notif.type);
            const Icon = config.icon;
            return (
              <div
                key={notif.id}
                className={`bg-white rounded-xl p-4 border transition-all hover:shadow-md cursor-pointer ${
                  notif.is_read ? 'border-gray-200' : 'border-purple-300 bg-purple-50'
                }`}
                onClick={() => !notif.is_read && markAsRead(notif.id)}
              >
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-gray-900 text-sm">
                        {notif.title}
                        {!notif.is_read && <span className="ml-2 w-2 h-2 bg-purple-600 rounded-full inline-block" />}
                      </h4>
                      <button
                        onClick={e => { e.stopPropagation(); deleteNotification(notif.id); }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{getTimeAgo(notif.created_at)}</span>
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