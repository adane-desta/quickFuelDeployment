// =====================================================
// FUEL INVENTORY VIEW - OPERATOR COMPONENT
// =====================================================
// Read-only view of station fuel inventory
// Shows stock levels and alerts
// =====================================================

import React, { useState, useEffect } from 'react';
import { Fuel, AlertTriangle, Droplet, TrendingDown, RefreshCw } from 'lucide-react';
import { stationService, inventoryService } from '../../lib/supabase/database';
import { useAuth } from '../../contexts/AuthContext';
import { notifyError } from '../../lib/utils/notifications';
import type { Station, StationFuelInventory } from '../../types/advanced';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';

export function FuelInventoryView() {
  const { user } = useAuth();
  const [station, setStation] = useState<Station | null>(null);
  const [inventory, setInventory] = useState<StationFuelInventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const stationData = await stationService.getOperatorStation(user.id);
      setStation(stationData);

      if (stationData) {
        const inventoryData = await inventoryService.getStationInventory(stationData.id);
        setInventory(inventoryData);
      }
    } catch (error) {
      notifyError('Failed to load inventory', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockPercentage = (current: number, max: number) => {
    return (current / max) * 100;
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'low':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getFuelIcon = (fuelName: string) => {
    const icons: Record<string, string> = {
      Petrol: '⛽',
      Diesel: '🚛',
      Benzene: '🧪',
      'Premium Gasoline': '⭐',
      Kerosene: '🔥',
    };
    return icons[fuelName] || '⛽';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (!station) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="size-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600">No station assigned to your account</p>
      </Card>
    );
  }

  const lowStockCount = inventory.filter((inv) => inv.stock_status === 'low').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fuel Inventory</h2>
          <p className="text-gray-600">{station?.name}</p>
          <p className="text-sm text-gray-500">Read-only view</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="size-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {lowStockCount > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex gap-3">
            <AlertTriangle className="size-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-900 mb-1">Low Stock Alert!</p>
              <p className="text-sm text-red-800">
                {lowStockCount} fuel type{lowStockCount !== 1 ? 's are' : ' is'} running low.
                Please notify the station owner.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Inventory Grid */}
      {inventory.length === 0 ? (
        <Card className="p-12 text-center">
          <Fuel className="size-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Fuel Inventory</h3>
          <p className="text-gray-600">No fuel types configured for this station.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {inventory.map((item) => (
            <Card key={item.id} className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{getFuelIcon(item.fuel_type_name!)}</div>
                  <div>
                    <h3 className="font-semibold text-lg">{item.fuel_type_name}</h3>
                    <p className="text-sm text-gray-500">{item.fuel_type_code}</p>
                  </div>
                </div>
                <Badge className={getStockStatusColor(item.stock_status!)}>
                  {item.stock_status?.toUpperCase()}
                </Badge>
              </div>

              {/* Stock Gauge */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-600">Current Stock</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {item.current_stock.toLocaleString()}L
                  </span>
                </div>

                <Progress
                  value={getStockPercentage(item.current_stock, item.maximum_capacity)}
                  className="h-3"
                />

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Minimum</p>
                    <p className="font-medium">{item.minimum_stock_threshold}L</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">Current</p>
                    <p className="font-medium">{item.current_stock}L</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-xs">Maximum</p>
                    <p className="font-medium">{item.maximum_capacity}L</p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Percentage</span>
                  <span className="font-medium">
                    {getStockPercentage(item.current_stock, item.maximum_capacity).toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Available Space</span>
                  <span className="font-medium">
                    {(item.maximum_capacity - item.current_stock).toLocaleString()}L
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Price per Liter</span>
                  <span className="font-semibold text-green-600">
                    ETB {item.effective_price?.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Availability</span>
                  <Badge className={item.is_available ? 'bg-green-600' : 'bg-red-600'}>
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
              </div>

              {/* Warning */}
              {item.stock_status === 'low' && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <TrendingDown className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Low Stock Warning</p>
                    <p className="text-xs">
                      Only {item.current_stock}L remaining. Below minimum threshold.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <Droplet className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Information:</p>
            <ul className="space-y-1 text-blue-800">
              <li>• This is a read-only view of the fuel inventory</li>
              <li>• Inventory updates automatically when fuel is dispensed</li>
              <li>• Only station owners can request fuel deliveries</li>
              <li>• If you see low stock, notify the station owner immediately</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
