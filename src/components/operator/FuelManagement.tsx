import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { stationService, inventoryService } from '../../lib/supabase/database';
import { notifyError } from '../../lib/utils/notifications';
import type { Station, StationFuelInventory } from '../../types/advanced';
import {
  Fuel, Droplet, AlertTriangle, TrendingUp, TrendingDown,
  Calendar, DollarSign, Gauge, Info, X, Loader2
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';

export function FuelManagement() {
  const { user } = useAuth();
  const [station, setStation] = useState<Station | null>(null);
  const [inventory, setInventory] = useState<StationFuelInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFuel, setSelectedFuel] = useState<StationFuelInventory | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const stationData = await stationService.getOperatorStation(user.id);
      if (!stationData) {
        setLoading(false);
        return;
      }
      setStation(stationData);
      const inventoryData = await inventoryService.getStationInventory(stationData.id);
      setInventory(inventoryData);
    } catch (error) {
      notifyError('Failed to load fuel inventory', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockLevel = (stock: number, min: number, max: number) => {
    const percentage = (stock / max) * 100;
    if (percentage >= 75) return { label: 'Good', color: 'text-green-600', bg: 'bg-green-100', icon: TrendingUp };
    if (percentage >= 25) return { label: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: TrendingDown };
    return { label: 'Low', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle };
  };

  const getStockPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not recorded';
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <Skeleton className="h-12 w-64 mb-4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="p-4 lg:p-8">
        <Card className="p-12 text-center">
          <AlertTriangle className="size-16 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-2xl font-bold mb-2">No Station Assigned</h3>
          <p className="text-gray-600">You are not assigned to any station.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Fuel Stock</h1>
        <p className="text-gray-600">View current fuel inventory for {station.name}</p>
        <p className="text-xs text-gray-500 mt-1">Read‑only view – updated automatically when fuel is dispensed</p>
      </div>

      {inventory.length === 0 ? (
        <Card className="p-12 text-center">
          <Fuel className="size-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No fuel inventory configured for this station.</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {inventory.map((item) => {
            const stockLevel = getStockLevel(item.current_stock, item.minimum_stock_threshold, item.maximum_capacity);
            const StockIcon = stockLevel.icon;
            const percentage = getStockPercentage(item.current_stock, item.maximum_capacity);

            return (
              <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Fuel className="size-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{item.fuel_type_name}</h3>
                        <p className="text-xs text-gray-500">{item.fuel_type_code}</p>
                      </div>
                    </div>
                    <Badge className={`${stockLevel.bg} ${stockLevel.color}`}>
                      <StockIcon className="size-3 mr-1" /> {stockLevel.label}
                    </Badge>
                  </div>

                  {/* Stock Gauge */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current Stock</span>
                      <span className="font-bold">{item.current_stock.toLocaleString()} L</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0 L</span>
                      <span>{item.maximum_capacity.toLocaleString()} L</span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="size-4 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">Price / L</p>
                        <p className="font-medium">ETB {item.effective_price?.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplet className="size-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Min. Threshold</p>
                        <p className="font-medium">{item.minimum_stock_threshold.toLocaleString()} L</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => {
                      setSelectedFuel(item);
                      setShowModal(true);
                    }}
                  >
                    <Info className="size-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Price Summary Card (all fuel types) */}
      <Card className="mt-6 p-5">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <DollarSign className="size-5 text-green-600" />
          Current Fuel Prices (ETB per Liter)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {inventory.map(item => (
            <div key={item.id} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">{item.fuel_type_name}</p>
              <p className="text-xl font-bold text-green-700">ETB {item.effective_price?.toFixed(2)}</p>
            </div>
          ))}
          {inventory.length === 0 && <p className="text-gray-500 col-span-full">No fuel prices available</p>}
        </div>
        <p className="text-xs text-gray-500 mt-3">Prices are set by the system administrator and cannot be modified here.</p>
      </Card>

      {/* Detailed Modal */}
      {showModal && selectedFuel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fuel className="size-6 text-blue-600" />
                <h3 className="text-xl font-bold">{selectedFuel.fuel_type_name} – Details</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Code</p>
                  <p className="font-medium">{selectedFuel.fuel_type_code || '—'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Status</p>
                  <Badge className={selectedFuel.is_available ? 'bg-green-600' : 'bg-red-600'}>
                    {selectedFuel.is_available ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
              </div>

              {/* Stock Details */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Droplet className="size-4 text-blue-600" /> Stock Information
                </h4>
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Stock</span>
                    <span className="font-bold">{selectedFuel.current_stock.toLocaleString()} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Minimum Threshold</span>
                    <span>{selectedFuel.minimum_stock_threshold.toLocaleString()} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maximum Capacity</span>
                    <span>{selectedFuel.maximum_capacity.toLocaleString()} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Space</span>
                    <span>{(selectedFuel.maximum_capacity - selectedFuel.current_stock).toLocaleString()} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fill Level</span>
                    <span>{getStockPercentage(selectedFuel.current_stock, selectedFuel.maximum_capacity).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <DollarSign className="size-4 text-green-600" /> Pricing
                </h4>
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per Liter</span>
                    <span className="font-bold text-green-700">ETB {selectedFuel.effective_price?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price</span>
                    <span>ETB {selectedFuel.fuel_type?.base_price_per_liter?.toFixed(2) || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Last Refill */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="size-4 text-gray-600" /> Refill Information
                </h4>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Refilled</span>
                    <span>{formatDate(selectedFuel.last_refilled_at)}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-600">Last Updated</span>
                    <span>{formatDate(selectedFuel.updated_at)}</span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800">
                <p className="font-medium mb-1">Note</p>
                <p>Stock levels update automatically when fuel is dispensed. This is a read‑only view.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}