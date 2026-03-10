import { useState } from 'react';
import { mockSystemActivities, mockQueueReports } from '../../data/mockData';
import {
  Activity, Search, Calendar, User, Building2, Fuel, CreditCard, Users, ShieldCheck,
  UserX, Filter, MessageSquare, Clock
} from 'lucide-react';

export function SystemActivity() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeView, setActiveView] = useState<'activity' | 'queue'>('activity');

  const filteredActivities = mockSystemActivities.filter(a => {
    const matchesSearch = !search || a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.actor.toLowerCase().includes(search.toLowerCase()) || (a.details || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'reservation_made': return { icon: Calendar, color: 'bg-blue-100 text-blue-600' };
      case 'fuel_updated': return { icon: Fuel, color: 'bg-green-100 text-green-600' };
      case 'user_registered': return { icon: User, color: 'bg-purple-100 text-purple-600' };
      case 'queue_reported': return { icon: Users, color: 'bg-yellow-100 text-yellow-600' };
      case 'payment_processed': return { icon: CreditCard, color: 'bg-emerald-100 text-emerald-600' };
      case 'station_verified': return { icon: ShieldCheck, color: 'bg-orange-100 text-orange-600' };
      case 'user_deactivated': return { icon: UserX, color: 'bg-red-100 text-red-600' };
      default: return { icon: Activity, color: 'bg-gray-100 text-gray-600' };
    }
  };

  const queueColors = {
    Short: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Long: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-gray-900 mb-1">System Activity</h1>
        <p className="text-gray-600">Monitor all platform activities and queue reports</p>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveView('activity')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeView === 'activity' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}>
          <Activity className="w-4 h-4 inline mr-2" />System Activity
        </button>
        <button onClick={() => setActiveView('queue')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeView === 'queue' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}>
          <MessageSquare className="w-4 h-4 inline mr-2" />Queue Reports ({mockQueueReports.length})
        </button>
      </div>

      {activeView === 'activity' ? (
        <>
          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search activity..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none" />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {['all', 'reservation_made', 'fuel_updated', 'user_registered', 'payment_processed', 'station_verified'].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-sm transition-colors ${
                    typeFilter === t ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  {t === 'all' ? 'All' : t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredActivities.map(activity => {
                const config = getActivityIcon(activity.type);
                const Icon = config.icon;
                return (
                  <div key={activity.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        {activity.details && <p className="text-sm text-gray-600 mt-0.5">{activity.details}</p>}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <User className="w-3 h-3" /> {activity.actor}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(activity.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* Queue Reports */
        <div className="space-y-3">
          {mockQueueReports.map(report => (
            <div key={report.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-gray-900">{report.stationName}</p>
                  <p className="text-xs text-gray-500">Reported by {report.reportedBy}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${queueColors[report.queueLength]}`}>
                  <Users className="w-3 h-3" /> {report.queueLength}
                </span>
              </div>
              {report.comment && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2 mb-2">"{report.comment}"</p>
              )}
              <p className="text-xs text-gray-400">{new Date(report.timestamp).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
