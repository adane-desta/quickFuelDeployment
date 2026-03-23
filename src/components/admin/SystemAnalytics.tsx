import { useState, useEffect } from 'react';
import { db } from '../../lib/supabase/services';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

export function SystemAnalytics() {
  const [selectedFuelType, setSelectedFuelType] = useState<'All' | string>('All');
  const [selectedStation, setSelectedStation] = useState<string>('All');
  const [fuelAnalytics, setFuelAnalytics] = useState<any[]>([]); // using any temporarily; replace with proper type
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  // Extract unique fuel types from the analytics data
  const fuelTypes = Array.from(new Set(fuelAnalytics.map(a => a.fuelType)));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, pricesData, stationsData] = await Promise.all([
        db.fuelAnalytics.getAll(),
        db.fuelPrices.getAll(),
        db.stations.getAll(),
      ]);
      setFuelAnalytics(analyticsData);
      setFuelPrices(pricesData);
      setStations(stationsData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Filter analytics data
  const filteredAnalytics = fuelAnalytics.filter((item) => {
    const fuelMatch = selectedFuelType === 'All' || item.fuelType === selectedFuelType;
    const stationMatch = selectedStation === 'All' || item.stationId === selectedStation;
    return fuelMatch && stationMatch;
  });

  // Calculate totals by fuel type (aggregate across all stations)
  const totalsByFuelType = fuelAnalytics.reduce((acc, item) => {
    if (!acc[item.fuelType]) {
      acc[item.fuelType] = { available: 0, dispensed: 0, digitalDispensed: 0 };
    }
    acc[item.fuelType].available += item.totalAvailable;
    acc[item.fuelType].dispensed += item.totalDispensed;
    acc[item.fuelType].digitalDispensed += item.digitalDispensed;
    return acc;
  }, {} as Record<string, { available: number; dispensed: number; digitalDispensed: number }>);

  // Prepare chart data for available fuel
  const availableFuelChartData = Object.entries(totalsByFuelType).map(([fuelType, data]) => ({
    name: fuelType,
    available: data.available,
  }));

  // Prepare chart data for dispensed fuel
  const dispensedFuelChartData = Object.entries(totalsByFuelType).map(([fuelType, data]) => ({
    name: fuelType,
    total: data.dispensed,
    digital: data.digitalDispensed,
    traditional: data.dispensed - data.digitalDispensed,
  }));

  // Prepare station-wise data for selected fuel type
  const stationWiseData = filteredAnalytics.map((item) => ({
    station: item.stationName.split(' ')[0], // Shortened name
    available: item.totalAvailable,
    dispensed: item.totalDispensed,
    digital: item.digitalDispensed,
  }));

  // Calculate digital adoption rate
  const totalDispensed = Object.values(totalsByFuelType).reduce((sum, item) => sum + item.dispensed, 0);
  const totalDigitalDispensed = Object.values(totalsByFuelType).reduce((sum, item) => sum + item.digitalDispensed, 0);
  const digitalAdoptionRate = totalDispensed > 0 ? ((totalDigitalDispensed / totalDispensed) * 100).toFixed(1) : '0';

  // Pie chart data for digital vs traditional
  const pieChartData = [
    { name: 'Digital Reservations', value: totalDigitalDispensed, color: '#3b82f6' },
    { name: 'Traditional Walk-ins', value: totalDispensed - totalDigitalDispensed, color: '#94a3b8' },
  ];

  const handleExport = () => {
    toast.success('Analytics report exported', {
      description: 'Your analytics data has been downloaded as CSV',
    });
  };

  // Helper: get current price for a fuel type name
  const getCurrentPrice = (fuelTypeName: string): number => {
    const priceEntry = fuelPrices.find(p => p.name === fuelTypeName);
    return priceEntry?.base_price_per_liter || 0;
  };

  // Calculate revenue for a given fuel type and liters
  const calculateRevenue = (fuelTypeName: string, liters: number) => {
    const price = getCurrentPrice(fuelTypeName);
    return price * liters;
  };

  // Total revenue from digital reservations
  const totalRevenue = Object.entries(totalsByFuelType).reduce((sum, [fuelType, data]) => {
    return sum + calculateRevenue(fuelType, data.digitalDispensed);
  }, 0);

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

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            <p className="text-sm text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      ) : (
        <>
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
                  {fuelTypes.map(fuel => (
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
                  {stations.map((station) => (
                    <SelectItem key={station.id} value={station.id}>
                      {station.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Fuel className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Available</p>
                  <p className="text-xl text-gray-900">
                    {Object.values(totalsByFuelType)
                      .reduce((sum, item) => sum + item.available, 0)
                      .toLocaleString()}
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

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Digital Rate</p>
                  <p className="text-xl text-gray-900">
                    {digitalAdoptionRate}
                    <span className="text-sm text-gray-500">%</span>
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Total Available Fuel by Type */}
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
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="available" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 pt-4 border-t space-y-2">
                {Object.entries(totalsByFuelType).map(([fuelType, data]) => (
                  <div key={fuelType} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{fuelType}</span>
                    <span className="text-gray-900">{data.available.toLocaleString()} L</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Total Dispensed Fuel */}
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-gray-900 mb-1">Dispensed Fuel Analysis</h3>
                  <p className="text-sm text-gray-500">Digital vs Traditional dispensing</p>
                </div>
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dispensedFuelChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="digital" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Digital" />
                  <Bar dataKey="traditional" fill="#94a3b8" radius={[8, 8, 0, 0]} name="Traditional" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 pt-4 border-t space-y-2">
                {Object.entries(totalsByFuelType).map(([fuelType, data]) => (
                  <div key={fuelType} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{fuelType} (Digital)</span>
                    <span className="text-blue-600">{data.digitalDispensed.toLocaleString()} L</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Digital Adoption Pie Chart */}
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-gray-900 mb-1">Digital Adoption</h3>
                <p className="text-sm text-gray-500">Reservation vs walk-in ratio</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {pieChartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-gray-900">{item.value.toLocaleString()} L</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Revenue Summary */}
            <Card className="p-6 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-gray-900 mb-1">Digital Revenue Summary</h3>
                  <p className="text-sm text-gray-500">Revenue from digital reservations</p>
                </div>
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.entries(totalsByFuelType).map(([fuelType, data]) => {
                  const price = getCurrentPrice(fuelType);
                  const revenue = calculateRevenue(fuelType, data.digitalDispensed);
                  return (
                    <div key={fuelType} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">{fuelType}</p>
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
          </div>

          {/* Station-wise Breakdown */}
          {selectedFuelType !== 'All' && selectedStation === 'All' && stationWiseData.length > 0 && (
            <Card className="p-6">
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
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="available" fill="#10b981" radius={[8, 8, 0, 0]} name="Available" />
                  <Bar dataKey="dispensed" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Total Dispensed" />
                  <Bar dataKey="digital" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Digital Dispensed" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Detailed Table */}
          <Card className="p-6 mt-6">
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
                <tbody>
                  {filteredAnalytics.map((item, index) => {
                    const digitalPercentage = item.totalDispensed > 0 
                      ? ((item.digitalDispensed / item.totalDispensed) * 100).toFixed(1) 
                      : '0';
                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
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
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}