import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import {
  Activity, Search, Calendar, User, Building2, Fuel, CreditCard, Users, ShieldCheck,
  UserX, Filter, MessageSquare, Clock, Loader2
} from 'lucide-react';
import { Card } from '../ui/card';

interface SystemActivityItem {
  id: string;
  action: string;
  description: string;
  category: string;
  metadata: any;
  user_id: string;
  user_role: string;
  created_at: string;
  success: boolean;
}

interface QueueReportItem {
  id: string;
  station_id: string;
  station_name?: string;
  reported_by: string;
  reported_by_name?: string;
  queue_length: 'Short' | 'Medium' | 'Long';
  comment: string;
  created_at: string;
}

export function SystemActivity() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeView, setActiveView] = useState<'activity' | 'queue'>('activity');
  const [activities, setActivities] = useState<SystemActivityItem[]>([]);
  const [queueReports, setQueueReports] = useState<QueueReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load system activities
      const { data: activityData, error: activityError } = await supabase
        .from('system_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (activityError) throw activityError;
      setActivities(activityData || []);

      // Load queue reports with station names
      const { data: queueData, error: queueError } = await supabase
        .from('queue_reports')
        .select(`
          *,
          station:stations(name),
          reporter:users!queue_reports_reported_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });
      if (queueError) throw queueError;

      const formattedQueue = (queueData || []).map((item: any) => ({
        ...item,
        station_name: item.station?.name,
        reported_by_name: item.reporter?.full_name,
      }));
      setQueueReports(formattedQueue);
    } catch (error) {
      console.error('Error loading system activity:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter activities by search and type
  const filteredActivities = activities.filter(act => {
    const matchesSearch = !search ||
      act.description.toLowerCase().includes(search.toLowerCase()) ||
      (act.user_role || '').toLowerCase().includes(search.toLowerCase()) ||
      (act.metadata ? JSON.stringify(act.metadata).toLowerCase().includes(search.toLowerCase()) : false);
    const matchesType = typeFilter === 'all' || act.action === typeFilter || act.category === typeFilter;
    return matchesSearch && matchesType;
  });

  const getActivityIcon = (category: string, action: string) => {
    const type = action || category;
    switch (type) {
      case 'reservation_made':
      case 'RESERVATION_CREATED':
        return { icon: Calendar, color: 'bg-blue-100 text-blue-600' };
      case 'fuel_updated':
      case 'PRICE_UPDATED':
        return { icon: Fuel, color: 'bg-green-100 text-green-600' };
      case 'user_registered':
      case 'USER_CREATED':
        return { icon: User, color: 'bg-purple-100 text-purple-600' };
      case 'queue_reported':
        return { icon: Users, color: 'bg-yellow-100 text-yellow-600' };
      case 'payment_processed':
        return { icon: CreditCard, color: 'bg-emerald-100 text-emerald-600' };
      case 'station_verified':
      case 'STATION_CREATED':
        return { icon: ShieldCheck, color: 'bg-orange-100 text-orange-600' };
      case 'user_deactivated':
        return { icon: UserX, color: 'bg-red-100 text-red-600' };
      default:
        return { icon: Activity, color: 'bg-gray-100 text-gray-600' };
    }
  };

  const queueColors = {
    Short: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Long: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">System Activity</h1>
        <p className="text-gray-600">Monitor all platform activities and queue reports</p>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveView('activity')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeView === 'activity' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />System Activity
        </button>
        <button
          onClick={() => setActiveView('queue')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeView === 'queue' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />Queue Reports ({queueReports.length})
        </button>
      </div>

      {activeView === 'activity' ? (
        <>
          {/* Search & Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search activity..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {['all', 'reservation_made', 'fuel_updated', 'user_registered', 'payment_processed', 'station_verified'].map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-sm transition-colors ${
                    typeFilter === t ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t === 'all' ? 'All' : t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {filteredActivities.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No activity found</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredActivities.map(activity => {
                  const config = getActivityIcon(activity.category, activity.action);
                  const Icon = config.icon;
                  return (
                    <div key={activity.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          {activity.metadata && (
                            <p className="text-sm text-gray-600 mt-0.5">
                              {typeof activity.metadata === 'object' ? JSON.stringify(activity.metadata) : activity.metadata}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <User className="w-3 h-3" /> {activity.user_role || 'System'}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(activity.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Queue Reports */
        <div className="space-y-3">
          {queueReports.length === 0 ? (
            <Card className="p-12 text-center text-gray-500">No queue reports found</Card>
          ) : (
            queueReports.map(report => (
              <div key={report.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-gray-900">{report.station_name || 'Unknown Station'}</p>
                    <p className="text-xs text-gray-500">Reported by {report.reported_by_name || 'User'}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${queueColors[report.queue_length]}`}>
                    <Users className="w-3 h-3" /> {report.queue_length}
                  </span>
                </div>
                {report.comment && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2 mb-2">"{report.comment}"</p>
                )}
                <p className="text-xs text-gray-400">{new Date(report.created_at).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}