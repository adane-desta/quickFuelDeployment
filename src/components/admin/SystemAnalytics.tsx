import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase/client';
import type { Station } from '../../types';
import {
  BarChart3, TrendingUp, Fuel, Zap, Filter, Download,
  Droplet, Activity, MapPin, Calendar, Loader2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

interface FuelType {
  id: string;
  name: string;
  base_price_per_liter: number;
}

interface InventoryItem {
  stationId: string;
  stationName: string;
  fuelTypeId: string;
  fuelTypeName: string;
  currentStock: number;
  updatedAt: string;
}

interface DispensingRecord {
  stationId: string;
  stationName: string;
  fuelTypeId: string;
  fuelTypeName: string;
  dispensedLiters: number;
}

type DateRange = 'today' | 'week' | 'month';

export function SystemAnalytics() {
  const [selectedFuelType, setSelectedFuelType] = useState<string>('All');
  const [selectedStation, setSelectedStation] = useState<string>('All');
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [dispensedData, setDispensedData] = useState<DispensingRecord[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to get date filters based on selected range
  const getDateFilter = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (dateRange) {
      case 'today':
        return { start: todayStart, end: now };
      case 'week': {
        const weekStart = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
        weekStart.setHours(0,0,0,0);
        return { start: weekStart, end: now };
      }
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: monthStart, end: now };
      }
      default:
        return { start: todayStart, end: now };
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch stations
      const { data: stationsData, error: stationsError } = await supabase
        .from('stations')
        .select('id, name')
        .order('name');
      if (stationsError) throw stationsError;
      setStations(stationsData || []);

      // 2. Fetch active fuel types
      const { data: fuelTypesData, error: fuelError } = await supabase
        .from('fuel_types')
        .select('id, name, base_price_per_liter')
        .eq('is_active', true)
        .order('name');
      if (fuelError) throw fuelError;
      setFuelTypes(fuelTypesData || []);

      // 3. Fetch current inventory from station_fuel_inventory with proper joins
      //    Use correct column names: updated_at (not last_updated)
      const { data: inventoryRaw, error: invError } = await supabase
        .from('station_fuel_inventory')
        .select(`
          current_stock,
          updated_at,
          station_id,
          fuel_type_id,
          station:stations(name),
          fuel_type:fuel_types(name)
        `);
      if (invError) throw invError;

      // Build inventory map (station + fuel type)
      const invMap = new Map<string, InventoryItem>();
      (inventoryRaw || []).forEach((item: any) => {
        const key = `${item.station_id}|${item.fuel_type_id}`;
        invMap.set(key, {
          stationId: item.station_id,
          stationName: item.station?.name || 'Unknown',
          fuelTypeId: item.fuel_type_id,
          fuelTypeName: item.fuel_type?.name || 'Unknown',
          currentStock: item.current_stock || 0,
          updatedAt: item.updated_at || new Date().toISOString(),
        });
      });

      // Create complete matrix (every station × every fuel type)
      const completeInventory: InventoryItem[] = [];
      for (const station of (stationsData || [])) {
        for (const fuel of (fuelTypesData || [])) {
          const key = `${station.id}|${fuel.id}`;
          const existing = invMap.get(key);
          if (existing) {
            completeInventory.push(existing);
          } else {
            completeInventory.push({
              stationId: station.id,
              stationName: station.name,
              fuelTypeId: fuel.id,
              fuelTypeName: fuel.name,
              currentStock: 0,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }
      setInventoryData(completeInventory);

      // 4. Fetch dispensed data from fuel_dispensing_logs with date filter
      const { start, end } = getDateFilter();
      const { data: dispensedRaw, error: dispError } = await supabase
        .from('fuel_dispensing_logs')
        .select(`
          quantity_dispensed,
          dispensed_at,
          station_id,
          fuel_type_id,
          station:stations(name),
          fuel_type:fuel_types(name)
        `)
        .gte('dispensed_at', start.toISOString())
        .lte('dispensed_at', end.toISOString());

      if (dispError) throw dispError;

      // Aggregate dispensed liters by station + fuel type
      const dispensedMap = new Map<string, number>();
      (dispensedRaw || []).forEach((log: any) => {
        const key = `${log.station_id}|${log.fuel_type_id}`;
        const qty = log.quantity_dispensed || 0;
        dispensedMap.set(key, (dispensedMap.get(key) || 0) + qty);
      });

      // Build dispensed records from the complete matrix
      const completeDispensed: DispensingRecord[] = [];
      for (const station of (stationsData || [])) {
        for (const fuel of (fuelTypesData || [])) {
          const key = `${station.id}|${fuel.id}`;
          const dispensed = dispensedMap.get(key) || 0;
          completeDispensed.push({
            stationId: station.id,
            stationName: station.name,
            fuelTypeId: fuel.id,
            fuelTypeName: fuel.name,
            dispensedLiters: dispensed,
          });
        }
      }
      setDispensedData(completeDispensed);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast.error(`Failed to load analytics: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange]);

  // Filtering for display
  const filteredInventory = inventoryData.filter(item => {
    const fuelMatch = selectedFuelType === 'All' || item.fuelTypeName === selectedFuelType;
    const stationMatch = selectedStation === 'All' || item.stationId === selectedStation;
    return fuelMatch && stationMatch;
  });

  const filteredDispensed = dispensedData.filter(item => {
    const fuelMatch = selectedFuelType === 'All' || item.fuelTypeName === selectedFuelType;
    const stationMatch = selectedStation === 'All' || item.stationId === selectedStation;
    return fuelMatch && stationMatch;
  });

  // Totals for key metrics (using all data)
  const totalAvailable = inventoryData.reduce((sum, item) => sum + item.currentStock, 0);
  const totalDispensed = dispensedData.reduce((sum, item) => sum + item.dispensedLiters, 0);
  const totalDigitalDispensed = totalDispensed;

  // Totals by fuel type for charts
  const totalsByFuelType = useMemo(() => {
    const map = new Map<string, { available: number; dispensed: number }>();
    for (const inv of inventoryData) {
      const fuel = inv.fuelTypeName;
      if (!map.has(fuel)) map.set(fuel, { available: 0, dispensed: 0 });
      map.get(fuel)!.available += inv.currentStock;
    }
    for (const disp of dispensedData) {
      const fuel = disp.fuelTypeName;
      if (!map.has(fuel)) map.set(fuel, { available: 0, dispensed: 0 });
      map.get(fuel)!.dispensed += disp.dispensedLiters;
    }
    return Array.from(map.entries()).map(([name, data]) => ({ name, ...data }));
  }, [inventoryData, dispensedData]);

  const availableFuelChartData = totalsByFuelType.map(t => ({ name: t.name, available: t.available }));
  const dispensedFuelChartData = totalsByFuelType.map(t => ({ name: t.name, digital: t.dispensed }));

  // Station-wise data for selected fuel type
  const stationWiseData = useMemo(() => {
    if (selectedFuelType === 'All') return [];
    const stationMap = new Map<string, { station: string; available: number; dispensed: number; digital: number }>();
    for (const inv of filteredInventory) {
      if (inv.fuelTypeName === selectedFuelType) {
        stationMap.set(inv.stationId, {
          station: inv.stationName.split(' ')[0],
          available: inv.currentStock,
          dispensed: 0,
          digital: 0,
        });
      }
    }
    for (const disp of filteredDispensed) {
      if (disp.fuelTypeName === selectedFuelType) {
        const existing = stationMap.get(disp.stationId);
        if (existing) {
          existing.dispensed += disp.dispensedLiters;
          existing.digital += disp.dispensedLiters;
        } else {
          stationMap.set(disp.stationId, {
            station: disp.stationName.split(' ')[0],
            available: 0,
            dispensed: disp.dispensedLiters,
            digital: disp.dispensedLiters,
          });
        }
      }
    }
    return Array.from(stationMap.values());
  }, [filteredInventory, filteredDispensed, selectedFuelType]);

  const getFuelPrice = (fuelName: string): number => {
    const ft = fuelTypes.find(f => f.name === fuelName);
    return ft?.base_price_per_liter || 0;
  };

  const totalRevenue = totalsByFuelType.reduce((sum, t) => {
    return sum + (getFuelPrice(t.name) * t.dispensed);
  }, 0);

  const handleExport = () => {
    const csvRows = [
      ['Station', 'Fuel Type', 'Available (L)', 'Dispensed (L) (Date Range)', 'Last Updated (Inventory)'],
      ...filteredInventory.map(item => [
        item.stationName,
        item.fuelTypeName,
        item.currentStock,
        filteredDispensed.find(d => d.stationId === item.stationId && d.fuelTypeName === item.fuelTypeName)?.dispensedLiters || 0,
        new Date(item.updatedAt).toLocaleString(),
      ]),
    ];
    const csv = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fuel_analytics_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics report exported');
  };

  const uniqueFuelTypes = Array.from(new Set(inventoryData.map(i => i.fuelTypeName))).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-sm text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">System Analytics</h1>
          <p className="text-gray-600">Real‑time fuel availability and dispensing analytics</p>
        </div>
        <Button onClick={handleExport} className="gap-2 bg-purple-600 hover:bg-purple-700">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select value={selectedFuelType} onValueChange={setSelectedFuelType}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select fuel type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Fuel Types</SelectItem>
              {uniqueFuelTypes.map(fuel => (
                <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <Select value={selectedStation} onValueChange={setSelectedStation}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select station" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Stations</SelectItem>
              {stations.map(station => (
                <SelectItem key={station.id} value={station.id}>{station.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <Select value={dateRange} onValueChange={(val: DateRange) => setDateRange(val)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Fuel className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Available</p>
              <p className="text-xl text-gray-900">
                {totalAvailable.toLocaleString()}
                <span className="text-sm text-gray-500"> L</span>
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Dispensed</p>
              <p className="text-xl text-gray-900">
                {totalDispensed.toLocaleString()}
                <span className="text-sm text-gray-500"> L</span>
              </p>
              <p className="text-xs text-gray-400">{dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This week' : 'This month'}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Digital Dispensed</p>
              <p className="text-xl text-gray-900">
                {totalDigitalDispensed.toLocaleString()}
                <span className="text-sm text-gray-500"> L</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Available Fuel Stock</h3>
              <p className="text-sm text-gray-500">Current inventory across all stations</p>
            </div>
            <Droplet className="w-5 h-5 text-blue-600" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={availableFuelChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Bar dataKey="available" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 pt-4 border-t space-y-2">
            {totalsByFuelType.map(t => (
              <div key={t.name} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t.name}</span>
                <span className="text-gray-900">{t.available.toLocaleString()} L</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Dispensed Fuel (Digital)</h3>
              <p className="text-sm text-gray-500">Fuel dispensed through reservations ({dateRange})</p>
            </div>
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dispensedFuelChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Bar dataKey="digital" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Digital Dispensed" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 pt-4 border-t space-y-2">
            {totalsByFuelType.map(t => (
              <div key={t.name} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t.name} (Digital)</span>
                <span className="text-blue-600">{t.dispensed.toLocaleString()} L</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Revenue Summary */}
      <Card className="p-6 mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Digital Revenue Summary</h3>
            <p className="text-sm text-gray-500">Revenue from digital reservations ({dateRange})</p>
          </div>
          <Activity className="w-5 h-5 text-green-600" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {totalsByFuelType.map(t => {
            const price = getFuelPrice(t.name);
            const revenue = price * t.dispensed;
            return (
              <div key={t.name} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <p className="text-xs text-gray-600 mb-1">{t.name}</p>
                <p className="text-2xl text-gray-900 mb-2">ETB {revenue.toLocaleString()}</p>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between"><span>Volume:</span><span>{t.dispensed.toLocaleString()} L</span></div>
                  <div className="flex justify-between"><span>Rate:</span><span>ETB {price}/L</span></div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Total Digital Revenue</span>
            <span className="text-2xl text-green-600">ETB {totalRevenue.toLocaleString()}</span>
          </div>
        </div>
      </Card>

      {/* Station-wise Breakdown */}
      {selectedFuelType !== 'All' && stationWiseData.length > 0 && (
        <Card className="p-6 mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Station-wise {selectedFuelType} Analysis</h3>
            <p className="text-sm text-gray-500">Availability and dispensing by station ({dateRange})</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stationWiseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="station" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="available" fill="#10b981" radius={[8, 8, 0, 0]} name="Available" />
              <Bar dataKey="dispensed" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Total Dispensed" />
              <Bar dataKey="digital" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Digital Dispensed" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Detailed Table */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Detailed Analytics Table</h3>
          <p className="text-sm text-gray-500">Inventory and dispensing data (dispensed filtered by {dateRange})</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Station</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Fuel Type</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Available (L)</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Dispensed (L)</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Last Updated (Inventory)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInventory.map((item, idx) => {
                const dispensed = filteredDispensed.find(d => d.stationId === item.stationId && d.fuelTypeName === item.fuelTypeName)?.dispensedLiters || 0;
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{item.stationName}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        item.fuelTypeName === 'Petrol' ? 'bg-blue-100 text-blue-700' :
                        item.fuelTypeName === 'Diesel' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.fuelTypeName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900">{item.currentStock.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-right text-blue-600">{dispensed.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{new Date(item.updatedAt).toLocaleString()}</td>
                  </tr>
                );
              })}
              {filteredInventory.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}