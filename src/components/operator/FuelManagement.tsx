import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockStations } from '../../data/mockData';
import { Droplets, Fuel, Save, CheckCircle, Loader2, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

export function FuelManagement() {
  const { user } = useAuth();
  const station = mockStations.find(s => s.id === user?.stationId) || mockStations[0];

  const [petrolAvailable, setPetrolAvailable] = useState(station.petrolAvailable);
  const [dieselAvailable, setDieselAvailable] = useState(station.dieselAvailable);
  const [petrolStock, setPetrolStock] = useState(station.petrolStock || 0);
  const [dieselStock, setDieselStock] = useState(station.dieselStock || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('2026-02-15 09:00 AM');

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setIsSaving(false);
    setSaved(true);
    setLastUpdated(new Date().toLocaleString());
    setTimeout(() => setSaved(false), 3000);
  };

  const getStockLevel = (stock: number) => {
    if (stock > 5000) return { label: 'Good', color: 'text-green-600', bg: 'bg-green-100', icon: TrendingUp };
    if (stock > 2000) return { label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: TrendingDown };
    return { label: 'Low', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle };
  };

  const petrolLevel = getStockLevel(petrolStock);
  const dieselLevel = getStockLevel(dieselStock);

  return (
    <div className="p-4 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-gray-900 mb-1">Fuel Management</h1>
        <p className="text-gray-600">Update fuel availability and stock levels for {station.name}</p>
        <p className="text-xs text-gray-400 mt-1">Last updated: {lastUpdated}</p>
      </div>

      {saved && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">Fuel information updated successfully! Changes are now visible to drivers.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Petrol */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center justify-between">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Fuel className="w-5 h-5 text-blue-600" /> Petrol
            </h3>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${petrolLevel.bg} ${petrolLevel.color}`}>
              {petrolLevel.label}
            </span>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${petrolAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-gray-900">Availability</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={petrolAvailable}
                  onChange={e => setPetrolAvailable(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
              </label>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">Stock Level (Liters)</label>
              <input type="number" value={petrolStock}
                onChange={e => setPetrolStock(Math.max(0, Number(e.target.value)))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                min="0" step="100" />
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${petrolStock > 5000 ? 'bg-green-500' : petrolStock > 2000 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, (petrolStock / 15000) * 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0L</span><span>15,000L</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {[1000, 2000, 5000].map(v => (
                <button key={v} onClick={() => setPetrolStock(v)}
                  className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700">
                  {(v / 1000).toFixed(0)}K L
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Diesel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex items-center justify-between">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Fuel className="w-5 h-5 text-purple-600" /> Diesel
            </h3>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${dieselLevel.bg} ${dieselLevel.color}`}>
              {dieselLevel.label}
            </span>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${dieselAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-gray-900">Availability</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={dieselAvailable}
                  onChange={e => setDieselAvailable(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
              </label>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">Stock Level (Liters)</label>
              <input type="number" value={dieselStock}
                onChange={e => setDieselStock(Math.max(0, Number(e.target.value)))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                min="0" step="100" />
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${dieselStock > 5000 ? 'bg-green-500' : dieselStock > 2000 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, (dieselStock / 15000) * 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0L</span><span>15,000L</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {[1000, 2000, 5000].map(v => (
                <button key={v} onClick={() => setDieselStock(v)}
                  className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700">
                  {(v / 1000).toFixed(0)}K L
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Price Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <h3 className="text-gray-900 mb-3">Current Fuel Prices (ETB per Liter)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-xs text-gray-500">Petrol</p>
            <p className="text-2xl text-blue-700">65.00</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-center">
            <p className="text-xs text-gray-500">Diesel</p>
            <p className="text-2xl text-purple-700">58.00</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Prices are set by the government and cannot be modified</p>
      </div>

      {/* Save Button */}
      <button onClick={handleSave} disabled={isSaving}
        className="w-full lg:w-auto py-3 px-8 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Changes</>}
      </button>
    </div>
  );
}
