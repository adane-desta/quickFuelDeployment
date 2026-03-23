// =====================================================
// MANAGE FUEL TYPES - ADMIN COMPONENT
// =====================================================
// ADMIN-ONLY: Manage fuel types and system-wide prices
// Station owners CANNOT change prices (read-only)
// =====================================================

import React, { useState, useEffect } from 'react';
import { Fuel, Plus, Edit, DollarSign, TrendingUp, History, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fuelTypeService } from '../../lib/supabase/database';
import { notifications, notifyError, notifyWarning } from '../../lib/utils/notifications';
import type { FuelType } from '../../types/advanced';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export function ManageFuelTypes() {
  const { user } = useAuth();
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFuel, setEditingFuel] = useState<FuelType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    base_price_per_liter: '',
    color_code: '#3B82F6',
  });

  useEffect(() => {
    loadFuelTypes();
  }, []);

  const loadFuelTypes = async () => {
    setLoading(true);
    try {
      const data = await fuelTypeService.getAllFuelTypes();
      setFuelTypes(data);
    } catch (error) {
      notifyError('Failed to load fuel types', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fuel: FuelType) => {
    setEditingFuel(fuel);
    setFormData({
      name: fuel.name,
      code: fuel.code,
      base_price_per_liter: fuel.base_price_per_liter.toString(),
      color_code: fuel.color_code || '#3B82F6',
    });
    setDialogOpen(true);
  };

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingFuel || !user) return;

    const newPrice = parseFloat(formData.base_price_per_liter);
    if (isNaN(newPrice) || newPrice <= 0) {
      notifyWarning('Please enter a valid price');
      return;
    }

    setProcessing(true);
    try {
      const success = await fuelTypeService.updateFuelPrice(
        editingFuel.id,
        newPrice,
        user.id
      );

      if (success) {
        notifications.fuelType.updated();
        setDialogOpen(false);
        setEditingFuel(null);
        loadFuelTypes();
      }
    } catch (error) {
      notifyError('Failed to update price', error);
    } finally {
      setProcessing(false);
    }
  };

  const getPriceChange = (fuel: FuelType) => {
    // In real implementation, compare with previous price from history
    // For now, just show current price
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Fuel Types & Pricing</h2>
          <p className="text-gray-600">
            System-wide fuel price management (Admin Only)
          </p>
        </div>
        <Badge className="bg-purple-600 text-lg px-4 py-2">
          Admin Control
        </Badge>
      </div>

      {/* Important Notice */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex gap-3">
          <AlertCircle className="size-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-900">
            <p className="font-medium mb-1">💡 System-Wide Price Control:</p>
            <ul className="space-y-1 text-amber-800">
              <li>• <strong>Only admins</strong> can change fuel prices</li>
              <li>• Prices set here apply to <strong>all stations</strong> by default</li>
              <li>• Station owners can view prices but <strong>cannot modify</strong> them</li>
              <li>• Station owners may set custom prices (overrides base price)</li>
              <li>• All price changes are logged with admin details</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Fuel Types Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fuelTypes.map((fuel) => (
          <Card key={fuel.id} className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="size-4 rounded-full"
                    style={{ backgroundColor: fuel.color_code || '#3B82F6' }}
                  />
                  <h3 className="font-semibold text-lg">{fuel.name}</h3>
                </div>
                <p className="text-sm text-gray-500 font-mono">{fuel.code}</p>
              </div>
              <Badge className={fuel.is_active ? 'bg-green-600' : 'bg-gray-500'}>
                {fuel.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="space-y-3">
              {/* Current Price */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-700 mb-1">System Base Price</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-green-900">
                    ETB {fuel.base_price_per_liter.toFixed(2)}
                  </p>
                  <span className="text-sm text-green-700">/liter</span>
                </div>
              </div>

              {/* Last Update */}
              {fuel.updated_at && (
                <div className="text-xs text-gray-500">
                  <p>Last updated: {new Date(fuel.updated_at).toLocaleDateString()}</p>
                  {fuel.updated_by && <p>By: Admin</p>}
                </div>
              )}

              {/* Actions */}
              <Button
                onClick={() => handleEdit(fuel)}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <Edit className="size-4 mr-2" />
                Update Price
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Price Update Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Fuel Price</DialogTitle>
            <DialogDescription>
              Set new system-wide base price for {editingFuel?.name}
            </DialogDescription>
          </DialogHeader>

          {editingFuel && (
            <form onSubmit={handleUpdatePrice} className="space-y-4">
              {/* Current Price */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Current Price</p>
                <p className="text-2xl font-bold">
                  ETB {editingFuel.base_price_per_liter.toFixed(2)} /liter
                </p>
              </div>

              {/* New Price */}
              <div>
                <Label htmlFor="new_price">New Base Price (ETB/Liter) *</Label>
                <Input
                  id="new_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.base_price_per_liter}
                  onChange={(e) =>
                    setFormData({ ...formData, base_price_per_liter: e.target.value })
                  }
                  placeholder="e.g., 65.50"
                  autoFocus
                />
              </div>

              {/* Price Change Preview */}
              {formData.base_price_per_liter && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">Price Change Preview:</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-800">Old Price:</span>
                    <span className="font-mono">
                      ETB {editingFuel.base_price_per_liter.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-800">New Price:</span>
                    <span className="font-mono font-semibold">
                      ETB {parseFloat(formData.base_price_per_liter || '0').toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1 pt-1 border-t border-blue-200">
                    <span className="text-blue-800">Difference:</span>
                    <span
                      className={`font-semibold ${
                        parseFloat(formData.base_price_per_liter || '0') >
                        editingFuel.base_price_per_liter
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {parseFloat(formData.base_price_per_liter || '0') >
                      editingFuel.base_price_per_liter
                        ? '+'
                        : ''}
                      {(
                        parseFloat(formData.base_price_per_liter || '0') -
                        editingFuel.base_price_per_liter
                      ).toFixed(2)}{' '}
                      ETB
                    </span>
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                <p className="font-medium mb-1">⚠️ Important:</p>
                <ul className="space-y-1 text-xs text-amber-800">
                  <li>• This changes the base price system-wide</li>
                  <li>• All stations will use this new base price</li>
                  <li>• Stations with custom prices are not affected</li>
                  <li>• Change will be logged with your admin account</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button type="submit" disabled={processing} className="flex-1">
                  {processing ? (
                    <>
                      <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <DollarSign className="size-4 mr-2" />
                      Update Price
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Statistics */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Fuel Type Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Types</p>
            <p className="text-2xl font-bold">{fuelTypes.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {fuelTypes.filter((f) => f.is_active).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Average Price</p>
            <p className="text-2xl font-bold text-blue-600">
              ETB{' '}
              {(
                fuelTypes.reduce((sum, f) => sum + f.base_price_per_liter, 0) / fuelTypes.length
              ).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Highest Price</p>
            <p className="text-2xl font-bold text-purple-600">
              ETB {Math.max(...fuelTypes.map((f) => f.base_price_per_liter)).toFixed(2)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
