import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockStations } from '../../data/mockData';
import { Users, Clock, Save, CheckCircle, Loader2, AlertTriangle, Info } from 'lucide-react';

export function QueueManagement() {
  const { user } = useAuth();
  const station = mockStations.find(s => s.id === user?.stationId) || mockStations[0];

  const [queueLength, setQueueLength] = useState<'Short' | 'Medium' | 'Long'>(station.queueLength);
  const [waitTime, setWaitTime] = useState(station.waitTime);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('2026-02-15 10:30 AM');

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaved(true);
    setLastUpdated(new Date().toLocaleString());
    setTimeout(() => setSaved(false), 3000);
  };

  const queueOptions = [
    { value: 'Short' as const, label: 'Short Queue', desc: '0-10 vehicles', time: '~5 min', color: 'border-green-500 bg-green-50 text-green-700', dot: 'bg-green-500' },
    { value: 'Medium' as const, label: 'Medium Queue', desc: '10-25 vehicles', time: '~15 min', color: 'border-yellow-500 bg-yellow-50 text-yellow-700', dot: 'bg-yellow-500' },
    { value: 'Long' as const, label: 'Long Queue', desc: '25+ vehicles', time: '~25+ min', color: 'border-red-500 bg-red-50 text-red-700', dot: 'bg-red-500' },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-gray-900 mb-1">Queue Management</h1>
        <p className="text-gray-600">Update queue status for {station?.name}</p>
        <p className="text-xs text-gray-400 mt-1">Last updated: {lastUpdated}</p>
      </div>

      {saved && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">Queue status updated! Drivers will see the changes in real time.</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
          <h3 className="text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> Current Queue Status
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {queueOptions.map(opt => (
              <button key={opt.value} onClick={() => { setQueueLength(opt.value); setWaitTime(opt.value === 'Short' ? 5 : opt.value === 'Medium' ? 15 : 25); }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  queueLength === opt.value ? opt.color : 'border-gray-200 hover:border-gray-300'
                }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${opt.dot} ${queueLength === opt.value ? 'animate-pulse' : ''}`} />
                  <span className="text-sm">{opt.label}</span>
                </div>
                <p className="text-xs text-gray-500">{opt.desc}</p>
                <p className="text-xs text-gray-500">{opt.time} wait</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-orange-50 px-4 py-3 border-b border-orange-100">
          <h3 className="text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" /> Estimated Wait Time
          </h3>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-4">
            <input type="range" min="0" max="60" value={waitTime}
              onChange={e => setWaitTime(Number(e.target.value))}
              className="flex-1 h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer" />
            <div className="w-20 text-center">
              <span className="text-2xl text-gray-900">{waitTime}</span>
              <p className="text-xs text-gray-500">minutes</p>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>0 min</span><span>30 min</span><span>60 min</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-gray-900 flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-500" /> Additional Notes (Optional)
          </h3>
        </div>
        <div className="p-4">
          <textarea value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)}
            placeholder="Any special information for drivers (e.g., 'Cash only today', 'Lane 3 closed')"
            rows={3} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none" />
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-yellow-900">Keep queue status up to date</p>
          <p className="text-xs text-yellow-800 mt-1">Drivers rely on accurate queue information to plan their visits. Update regularly for the best experience.</p>
        </div>
      </div>

      <button onClick={handleSave} disabled={isSaving}
        className="w-full lg:w-auto py-3 px-8 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Update Queue Status</>}
      </button>
    </div>
  );
}
