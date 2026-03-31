// =====================================================
// FUEL TYPE SELECTOR - DRIVER COMPONENT
// =====================================================
// Select fuel type with real-time pricing from database
// Shows availability and calculates total cost
// =====================================================

import React, { useState, useEffect } from 'react';
import { Fuel, DollarSign, Droplet, AlertCircle } from 'lucide-react';
import { inventoryService } from '../../lib/supabase/database';
import { notifyError } from '../../lib/utils/notifications';
import type { StationFuelInventory } from '../../types/advanced';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Skeleton } from '../ui/skeleton';

interface FuelTypeSelectorProps {
  stationId: string;
  onSelectFuel: (fuelTypeId: string, quantity: number, pricePerLiter: number, totalPrice: number) => void;
  selectedFuelTypeId?: string;
  selectedQuantity?: number;
}

export function FuelTypeSelector({
  stationId,
  onSelectFuel,
  selectedFuelTypeId,
  selectedQuantity = 10,
}: FuelTypeSelectorProps) {
  const [inventory, setInventory] = useState<StationFuelInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(selectedQuantity);
  const [selectedFuel, setSelectedFuel] = useState<StationFuelInventory | null>(null);

  useEffect(() => {
    loadInventory();
  }, [stationId]);

  useEffect(() => {
    if (selectedFuel && quantity > 0) {
      const totalPrice = selectedFuel.effective_price! * quantity;
      onSelectFuel(selectedFuel.fuel_type_id, quantity, selectedFuel.effective_price!, totalPrice);
    }
  }, [selectedFuel, quantity]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getStationInventory(stationId);
      const available = data.filter((inv) => inv.is_available);
      setInventory(available);

      // Auto-select if only one option or pre-selected
      if (selectedFuelTypeId) {
        const fuel = available.find((f) => f.fuel_type_id === selectedFuelTypeId);
        if (fuel) setSelectedFuel(fuel);
      } else if (available.length === 1) {
        setSelectedFuel(available[0]);
      }
    } catch (error) {
      notifyError('Failed to load fuel types', error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFuel = (fuel: StationFuelInventory) => {
    setSelectedFuel(fuel);
  };

  const handleQuantityChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0 && num <= 200) {
      setQuantity(num);
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
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (inventory.length === 0) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="size-12 mx-auto mb-3 text-gray-400" />
        <p className="font-medium text-gray-700 mb-1">No Fuel Available</p>
        <p className="text-sm text-gray-500">
          This station currently has no fuel in stock.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Select Fuel Type</h3>
        <p className="text-sm text-gray-600">Choose your fuel and quantity</p>
      </div>

      {/* Fuel Types */}
      <div className="grid gap-3 sm:grid-cols-2">
        {inventory.map((fuel) => (
          <Card
            key={fuel.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedFuel?.id === fuel.id
                ? 'border-2 border-primary bg-primary/5'
                : 'border border-gray-200'
            }`}
            onClick={() => handleSelectFuel(fuel)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{getFuelIcon(fuel.fuel_type_name!)}</div>
                <div>
                  <p className="font-semibold text-base">{fuel.fuel_type_name}</p>
                  <p className="text-xs text-gray-500">{fuel.fuel_type_code}</p>
                </div>
              </div>
              {selectedFuel?.id === fuel.id && (
                <Badge className="bg-primary">Selected</Badge>
              )}
            </div>

            <div className="space-y-2">
              {/* Price */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Price per Liter</span>
                <span className="font-semibold text-green-600">
                  ETB {fuel.effective_price?.toFixed(2)}
                </span>
              </div>

              {/* Stock Level */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Available Stock</span>
                <div className="flex items-center gap-1">
                  <Droplet className="size-3 text-blue-500" />
                  <span className={`text-sm font-medium ${
                    fuel.stock_status === 'low' ? 'text-red-600' :
                    fuel.stock_status === 'moderate' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {fuel.current_stock.toLocaleString()}L
                  </span>
                </div>
              </div>
            </div>

            {fuel.stock_status === 'low' && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  Low stock - Book soon!
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Quantity Selector */}
      {selectedFuel && (
        <Card className="p-4 border-2 border-primary/20 bg-primary/5">
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity" className="text-base font-semibold mb-2 block">
                <Fuel className="size-4 inline mr-1" />
                Fuel Quantity (Liters)
              </Label>
              <div className="flex gap-3">
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="200"
                  step="1"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="text-lg font-semibold text-center"
                />
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(200, quantity + 5))}
                    className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 5))}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                  >
                    -5
                  </button>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Min: 1L</span>
                <span>Max: 200L</span>
              </div>
            </div>

            {/* Quick Select Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 30, 50].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQuantity(val)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    quantity === val
                      ? 'bg-primary text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-primary'
                  }`}
                >
                  {val}L
                </button>
              ))}
            </div>

            {/* Validation */}
            {quantity > selectedFuel.current_stock && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="size-4" />
                  Requested quantity exceeds available stock ({selectedFuel.current_stock}L)
                </p>
              </div>
            )}

            {/* Price Summary */}
            <div className="pt-4 border-t border-primary/20">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price per Liter</span>
                  <span className="font-medium">ETB {selectedFuel.effective_price?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quantity</span>
                  <span className="font-medium">{quantity} Liters</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-primary/20">
                  <span className="font-semibold">Total Price</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      ETB {(selectedFuel.effective_price! * quantity).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {quantity}L × ETB {selectedFuel.effective_price?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Info */}
      <Card className="p-3 bg-blue-50 border-blue-200">
        <div className="flex gap-2 text-sm text-blue-900">
          <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Price includes:</p>
            <p className="text-xs text-blue-800">All taxes and service charges. Pay securely at checkout.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
