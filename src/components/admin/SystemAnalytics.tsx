import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { FuelAnalytics, FuelPrice, Station } from '../../types';
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

interface AnalyticsRecord {
  id: string;
  stationId: string;
  stationName: string;
  fuelType: string;
  fuelTypeId: string;
  totalAvailable: number;
  totalDispensed: number;
  digitalDispensed: number;
  lastUpdated: string;
}

interface FuelTypePrice {
  id: string;
  name: string;
  base_price_per_liter: number;
}

export function SystemAnalytics() {
  const [selectedFuelType, setSelectedFuelType] = useState<string>('All');
  const [selectedStation, setSelectedStation] = useState<string>('All');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsRecord[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelTypePrice[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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

      // 2. Fetch fuel types (for prices and names)
      const { data: fuelTypesData, error: fuelError } = await supabase
        .from('fuel_types')
        .select('id, name, base_price_per_liter')
        .eq('is_active', true)
        .order('name');
      if (fuelError) throw fuelError;
      setFuelTypes(fuelTypesData || []);

      // 3. Fetch fuel analytics with joins
      const { data: analytics, error: analyticsError } = await supabase
        .from('fuel_analytics')
        .select(`
          id,
          station_id,
          fuel_type_id,
          total_available,
          total_dispensed,
          digital_dispensed,
          last_updated,
          station:stations!station_id (name),
          fuel_type:fuel_types!fuel_type_id (name)
        `)
        .order('last_updated', { ascending: false });

      if (analyticsError) throw analyticsError;

      const formatted: AnalyticsRecord[] = (analytics || []).map((item: any) => ({
        id: item.id,
        stationId: item.station_id,
        stationName: item.station?.name || 'Unknown Station',
        fuelTypeId: item.fuel_type_id,
        fuelType: item.fuel_type?.name || 'Unknown Fuel',
        totalAvailable: item.total_available || 0,
        totalDispensed: item.total_dispensed || 0,
        digitalDispensed: item.digital_dispensed || 0,
        lastUpdated: item.last_updated,
      }));
      setAnalyticsData(formatted);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Filter analytics based on selections
  const filteredAnalytics = analyticsData.filter(item => {
    const fuelMatch = selectedFuelType === 'All' || item.fuelType === selectedFuelType;
    const stationMatch = selectedStation === 'All' || item.stationId === selectedStation;
    return fuelMatch && stationMatch;
  });

  // Aggregate totals by fuel type
  const totalsByFuelType = analyticsData.reduce((acc, item) => {
    const fuel = item.fuelType;
    if (!acc[fuel]) {
      acc[fuel] = { available: 0, dispensed: 0, digitalDispensed: 0 };
    }
    acc[fuel].available += item.totalAvailable;
    acc[fuel].dispensed += item.totalDispensed;
    acc[fuel].digitalDispensed += item.digitalDispensed;
    return acc;
  }, {} as Record<string, { available: number; dispensed: number; digitalDispensed: number }>);

  // Chart data for available fuel
  const availableFuelChartData = Object.entries(totalsByFuelType).map(([fuel, data]) => ({
    name: fuel,
    available: data.available,
  }));

  // Chart data for dispensed fuel (only digital)
  const dispensedFuelChartData = Object.entries(totalsByFuelType).map(([fuel, data]) => ({
    name: fuel,
    digital: data.digitalDispensed,
  }));

  // Station‑wise data for selected fuel type (when a specific fuel is chosen)
  const stationWiseData = filteredAnalytics.map(item => ({
    station: item.stationName.split(' ')[0], // Shortened name
    available: item.totalAvailable,
    dispensed: item.totalDispensed,
    digital: item.digitalDispensed,
  }));

  // Totals for metrics
  const totalAvailable = Object.values(totalsByFuelType).reduce((sum, d) => sum + d.available, 0);
  const totalDispensed = Object.values(totalsByFuelType).reduce((sum, d) => sum + d.dispensed, 0);
  const totalDigitalDispensed = Object.values(totalsByFuelType).reduce((sum, d) => sum + d.digitalDispensed, 0);

  // Helper: get base price for a fuel type name
  const getFuelPrice = (fuelName: string): number => {
    const ft = fuelTypes.find(f => f.name === fuelName);
    return ft?.base_price_per_liter || 0;
  };

  // Calculate revenue for a given fuel type and digital volume
  const calculateRevenue = (fuelName: string, liters: number) => {
    return getFuelPrice(fuelName) * liters;
  };

  const totalRevenue = Object.entries(totalsByFuelType).reduce((sum, [fuel, data]) => {
    return sum + calculateRevenue(fuel, data.digitalDispensed);
  }, 0);

  const handleExport = () => {
    // Simple CSV export example
    const csvRows = [
      ['Station', 'Fuel Type', 'Available (L)', 'Total Dispensed (L)', 'Digital Dispensed (L)', 'Digital %', 'Last Updated'],
      ...filteredAnalytics.map(item => [
        item.stationName,
        item.fuelType,
        item.totalAvailable,
        item.totalDispensed,
        item.digitalDispensed,
        ((item.digitalDispensed / (item.totalDispensed || 1)) * 100).toFixed(1) + '%',
        new Date(item.lastUpdated).toLocaleString(),
      ]),
    ];
    const csv = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fuel_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics report exported');
  };

  // Get unique fuel types from data for filter dropdown
  const uniqueFuelTypes = Array.from(new Set(analyticsData.map(a => a.fuelType))).sort();

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
          <h1 className="text-gray-900 mb-1">System Analytics</h1>
          <p className="text-gray-600">Comprehensive fuel availability and dispensing analytics</p>
        </div>
        <Button onClick={handleExport} className="gap-2 bg-purple-600 hover:bg-purple-700">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1">
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
        <div className="flex items-center gap-2 flex-1">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Available Fuel Stock Chart */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-gray-900 mb-1">Available Fuel Stock</h3>
              <p className="text-sm text-gray-500">Current inventory across all stations</p>
            </div>
            <Droplet className="w-5 h-5 text-blue-600" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={availableFuelChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Bar dataKey="available" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 pt-4 border-t space-y-2">
            {Object.entries(totalsByFuelType).map(([fuel, data]) => (
              <div key={fuel} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{fuel}</span>
                <span className="text-gray-900">{data.available.toLocaleString()} L</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Dispensed Fuel Analysis (Digital only) */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-gray-900 mb-1">Dispensed Fuel (Digital)</h3>
              <p className="text-sm text-gray-500">Fuel dispensed through reservations</p>
            </div>
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dispensedFuelChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Bar dataKey="digital" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Digital Dispensed" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 pt-4 border-t space-y-2">
            {Object.entries(totalsByFuelType).map(([fuel, data]) => (
              <div key={fuel} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{fuel} (Digital)</span>
                <span className="text-blue-600">{data.digitalDispensed.toLocaleString()} L</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Revenue Summary */}
      <Card className="p-6 mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-gray-900 mb-1">Digital Revenue Summary</h3>
            <p className="text-sm text-gray-500">Revenue from digital reservations</p>
          </div>
          <Calendar className="w-5 h-5 text-green-600" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(totalsByFuelType).map(([fuel, data]) => {
            const price = getFuelPrice(fuel);
            const revenue = calculateRevenue(fuel, data.digitalDispensed);
            return (
              <div key={fuel} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <p className="text-xs text-gray-600 mb-1">{fuel}</p>
                <p className="text-2xl text-gray-900 mb-2">ETB {revenue.toLocaleString()}</p>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Volume:</span>
                    <span>{data.digitalDispensed.toLocaleString()} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate:</span>
                    <span>ETB {price}/L</span>
                  </div>
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

      {/* Station-wise Breakdown (only when a specific fuel type is selected) */}
      {selectedFuelType !== 'All' && selectedStation === 'All' && stationWiseData.length > 0 && (
        <Card className="p-6 mb-6">
          <div className="mb-4">
            <h3 className="text-gray-900 mb-1">Station-wise {selectedFuelType} Analysis</h3>
            <p className="text-sm text-gray-500">Availability and dispensing by station</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stationWiseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="station" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="available" fill="#10b981" radius={[8, 8, 0, 0]} name="Available" />
              <Bar dataKey="dispensed" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Total Dispensed" />
              <Bar dataKey="digital" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Digital Dispensed" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Detailed Analytics Table */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-gray-900 mb-1">Detailed Analytics Table</h3>
          <p className="text-sm text-gray-500">Complete breakdown of fuel metrics</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Station</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Fuel Type</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Available (L)</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Total Dispensed (L)</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Digital Dispensed (L)</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Digital %</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAnalytics.map((item, idx) => {
                const digitalPercentage = item.totalDispensed > 0
                  ? ((item.digitalDispensed / item.totalDispensed) * 100).toFixed(1)
                  : '0';
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{item.stationName}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        item.fuelType === 'Petrol' ? 'bg-blue-100 text-blue-700' :
                        item.fuelType === 'Diesel' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.fuelType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900">{item.totalAvailable.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900">{item.totalDispensed.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-right text-blue-600">{item.digitalDispensed.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900">{digitalPercentage}%</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{new Date(item.lastUpdated).toLocaleString()}</td>
                  </tr>
                );
              })}
              {filteredAnalytics.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-gray-500">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}