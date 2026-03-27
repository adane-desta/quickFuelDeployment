import { useState, useEffect } from 'react';
import { db } from '../../lib/supabase/services';
import { supabase } from '../../lib/supabase/client'
import { Station } from '../../types';
import {
  Building2, Search, MapPin, Clock, Users, CheckCircle, XCircle, Shield, Eye,
  Loader2, X, Phone, AlertTriangle, Plus, Calendar, User
} from 'lucide-react';
import { AddStationModal } from './AddStationModal';
import { Button } from '../ui/button';
import { toast } from 'sonner';

export function StationManagement() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      setLoading(true);
      const data = await db.stations.getAll();
      setStations(data);
    } catch (error) {
      console.error('Error loading stations:', error);
      toast.error('Failed to load stations');
    } finally {
      setLoading(false);
    }
  };

  const filtered = stations.filter(s => {
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.address || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'verified' ? s.is_verified : !s.is_verified);
    return matchesSearch && matchesFilter;
  });

  const handleVerify = async (id: string) => {
    setVerifying(id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      console.log('Verifying station:', id, 'by user:', user.id);
      const result = await db.stations.verify(id, user.id);
      console.log('Verification result:', result);
      setStations(prev => prev.map(s => s.id === id ? { ...s, is_verified: true } : s));
      toast.success('Station verified successfully');
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification failed');
    } finally {
      setVerifying(null);
    }
  };

  const handleRevoke = async (id: string) => {
    setVerifying(id);
    try {
      await db.stations.update(id, { 
        is_verified: false,
        verified_by: null,
        verification_date: null,
      });
      setStations(prev => prev.map(s => s.id === id ? { ...s, is_verified: false } : s));
      toast.success('Verification revoked');
    } catch (error) {
      toast.error('Revocation failed');
    } finally {
      setVerifying(null);
    }
  };

  // Helper to format operating days
  const formatDays = (days: string[] | null) => {
    if (!days) return 'Not set';
    if (days.length === 7) return 'Every day';
    return days.map(d => d.slice(0, 3)).join(', ');
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-gray-900 mb-1">Station Management</h1>
        <p className="text-gray-600">Verify and manage fuel stations on the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-2xl text-gray-900">{stations.length}</p>
          <p className="text-sm text-gray-500">Total Stations</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-2xl text-green-600">{stations.filter(s => s.is_verified).length}</p>
          <p className="text-sm text-gray-500">Verified</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-2xl text-yellow-600">{stations.filter(s => !s.is_verified).length}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search stations..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'verified', 'pending'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === f ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Add Station Button */}
      <div className="mb-4">
        <Button onClick={() => setShowAddModal(true)} className="bg-green-600 text-white">
          <Plus className="w-4 h-4 mr-1" /> Add Station
        </Button>
      </div>

      {/* Stations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(station => (
          <div key={station.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className={`px-4 py-2 border-b ${station.is_verified ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className={`w-4 h-4 ${station.is_verified ? 'text-green-600' : 'text-yellow-600'}`} />
                  <h3 className="text-gray-900 text-sm">{station.name}</h3>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                  station.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {station.is_verified ? <><CheckCircle className="w-3 h-3" /> Verified</> : <><AlertTriangle className="w-3 h-3" /> Pending</>}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 truncate">{station.address || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 truncate">{station.owner_name || 'No owner'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {station.is_24_hours ? '24 hours' : `${station.opening_time} – ${station.closing_time}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 text-xs">{formatDays(station.operating_days)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedStation(station)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-4 h-4" /> Details
                </button>
                {!station.is_verified ? (
                  <button
                    onClick={() => handleVerify(station.id)}
                    disabled={verifying === station.id}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                  >
                    {verifying === station.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Shield className="w-4 h-4" /> Verify</>}
                  </button>
                ) : (
                  <button
                    onClick={() => handleRevoke(station.id)}
                    disabled={verifying === station.id}
                    className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                  >
                    {verifying === station.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" /> Revoke</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Station Detail Modal */}
      {selectedStation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900">Station Details</h3>
                <button onClick={() => setSelectedStation(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Building2 className="w-7 h-7 text-green-600" />
                  </div>
                  <h4 className="text-gray-900">{selectedStation.name}</h4>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs mt-1 ${
                    selectedStation.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedStation.is_verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>

                {[
                  { icon: User, label: 'Owner', value: selectedStation.owner_name },
                  { icon: MapPin, label: 'Address', value: selectedStation.address },
                  { icon: Phone, label: 'Phone', value: selectedStation.phone },
                  { icon: Clock, label: 'Hours', value: selectedStation.is_24_hours ? '24/7' : `${selectedStation.opening_time} – ${selectedStation.closing_time}` },
                  { icon: Calendar, label: 'Operating Days', value: formatDays(selectedStation.operating_days) },
                  { icon: FileText, label: 'Business License', value: selectedStation.business_license_number },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="text-gray-900 text-sm">{item.value || 'Not provided'}</p>
                    </div>
                  </div>
                ))}

                {/* Optional: show other license numbers if present */}
                {selectedStation.operating_license_number && (
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Operating License</p>
                      <p className="text-gray-900 text-sm">{selectedStation.operating_license_number}</p>
                    </div>
                  </div>
                )}

                {selectedStation.number_of_pumps && (
                  <div className="flex items-center gap-3">
                    <Fuel className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Number of Pumps</p>
                      <p className="text-gray-900 text-sm">{selectedStation.number_of_pumps}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                {!selectedStation.is_verified && (
                  <button
                    onClick={() => { handleVerify(selectedStation.id); setSelectedStation(null); }}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                  >
                    Verify Station
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Station Modal */}
      <AddStationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadStations}
      />
    </div>
  );
}