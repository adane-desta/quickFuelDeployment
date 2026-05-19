
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase/services';
import { FuelPrice } from '../../types';
import { DollarSign, Edit2, Save, X, AlertCircle, CheckCircle, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { toast } from 'sonner';

export function FuelPriceManagement() {
  const { user } = useAuth();
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ base_price_per_liter: number; effective_from: string }>({
    base_price_per_liter: 0,
    effective_from: '',
  });

  useEffect(() => {
    loadFuelPrices();
  }, []);

  const loadFuelPrices = async () => {
    try {
      setLoading(true);
      const prices = await db.fuelPrices.getAll();
      setFuelPrices(prices);
    } catch (error) {
      console.error('Error loading fuel prices:', error);
      toast.error('Failed to load fuel prices');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (price: FuelPrice) => {
    setEditingId(price.id);
    setEditValues({
      base_price_per_liter: price.base_price_per_liter,
      effective_from: price.effective_from,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({ base_price_per_liter: 0, effective_from: '' });
  };

  const handleSave = async (priceId: string) => {
    if (editValues.base_price_per_liter <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    if (!editValues.effective_from) {
      toast.error('Please select an effective date');
      return;
    }

    try {
      
      const updates = {
        base_price_per_liter: editValues.base_price_per_liter,
        effective_from: editValues.effective_from,
        updated_by: user?.fullName || 'Admin',
        updated_at: new Date().toISOString(),
      };

      await db.fuelPrices.update(priceId, updates);

      setFuelPrices((prev) =>
        prev.map((p) =>
          p.id === priceId
            ? { ...p, ...updates }
            : p
        )
      );

      const fuelType = fuelPrices.find((p) => p.id === priceId)?.name;
      toast.success(`${fuelType} price updated successfully`, {
        description: `New price: ETB ${editValues.base_price_per_liter.toFixed(2)}/L effective from ${new Date(editValues.effective_from).toLocaleDateString()}`,
      });

      setEditingId(null);
      setEditValues({ base_price_per_liter: 0, effective_from: '' });
    } catch (error) {
      console.error('Error updating fuel price:', error);
      toast.error('Failed to update fuel price');
    }
  };

  const getChangePercentage = (currentPrice: number, oldPrice: number = 60) => {
    const change = ((currentPrice - oldPrice) / oldPrice) * 100;
    return change.toFixed(1);
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-gray-900 mb-1">Fuel Price Management</h1>
        <p className="text-gray-600">Set and manage system-wide fuel prices. All prices are in Ethiopian Birr (ETB) per liter.</p>
      </div>


      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            <p className="text-sm text-gray-600">Loading fuel prices...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Price Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {fuelPrices.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <p className="text-gray-500 mb-4">No fuel prices found. Initializing default prices...</p>
                <Button onClick={loadFuelPrices} variant="outline">
                  Reload Prices
                </Button>
              </div>
            ) : (
              fuelPrices.map((price) => {
                const isEditing = editingId === price.id;
                const priceValue = price.base_price_per_liter || 0;
                const change = getChangePercentage(priceValue);
                const isIncrease = parseFloat(change) > 0;

                // Define a mapping from fuel type to color classes
const fuelTypeColors: Record<FuelPrice['name'], { bg: string; border: string; icon: string }> = {
  Petrol: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-500' },
  Diesel: { bg: 'bg-green-50', border: 'border-green-200', icon: 'bg-green-500' },
  'Premium Gasoline': { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'bg-purple-500' },
  Kerosene: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'bg-yellow-500' },
  Benzene: { bg: 'bg-red-50', border: 'border-red-200', icon: 'bg-red-500' },
};

                return (
                  <Card key={price.id} className="overflow-hidden">
                      <div className={`p-4 border-b ${fuelTypeColors[price?.name].bg} ${fuelTypeColors[price?.name].border}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              fuelTypeColors[price?.name].icon
                            }`}
                          >
                            <DollarSign className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-gray-900">{price?.name}</h3>
                            <p className="text-xs text-gray-500">Price per liter</p>
                          </div>
                        </div>
                        {!isEditing && (
                          <Button onClick={() => handleEdit(price)} variant="outline" size="sm" className="gap-2">
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="p-6">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`price-${price.id}`}>Price per Liter (ETB)</Label>
                            <Input
                              id={`price-${price.id}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={editValues.base_price_per_liter}
                              onChange={(e) => setEditValues((prev) => ({ ...prev, base_price_per_liter: parseFloat(e.target.value) || 0 }))}
                              className="mt-2"
                              placeholder="Enter price"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`date-${price.id}`}>Effective From</Label>
                            <Input
                              id={`date-${price.id}`}
                              type="date"
                              value={editValues.effective_from}
                              onChange={(e) => setEditValues((prev) => ({ ...prev, effective_from: e.target.value }))}
                              className="mt-2"
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => handleSave(price.id)} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
                              <Save className="w-4 h-4" />
                              Save Changes
                            </Button>
                            <Button onClick={handleCancel} variant="outline" className="flex-1 gap-2">
                              <X className="w-4 h-4" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Current Price */}
                          <div className="text-center py-4 bg-gray-50 rounded-xl">
                            <p className="text-4xl text-gray-900 mb-1">ETB {price.base_price_per_liter.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">per liter</p>
                            <div className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs ${
                              isIncrease ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                              <TrendingUp className={`w-3 h-3 ${!isIncrease ? 'rotate-180' : ''}`} />
                              {isIncrease ? '+' : ''}{change}% from baseline
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                              <p className="text-sm text-gray-900">{new Date(price.updated_at).toLocaleDateString()}</p>
                              <p className="text-xs text-gray-500 mt-1">{new Date(price.updated_at).toLocaleTimeString()}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Effective From
                              </p>
                              <p className="text-sm text-gray-900">{new Date(price.effective_from).toLocaleDateString()}</p>
                            </div>
                          </div>

                          {/* Updated By */}
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <div>
                              <p className="text-xs text-gray-500">Updated by</p>
                              <p className="text-sm text-gray-900">{price.updated_by}</p>
                            </div>
                          </div>

                          {/* Example Calculations */}
                          <div className="border-t pt-4">
                            <p className="text-xs text-gray-500 mb-2">Example Calculations</p>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex justify-between">
                                <span>20 liters:</span>
                                <span className="text-gray-900">ETB {(price.base_price_per_liter * 20).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>50 liters:</span>
                                <span className="text-gray-900">ETB {(price.base_price_per_liter * 50).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>100 liters:</span>
                                <span className="text-gray-900">ETB {(price.base_price_per_liter * 100).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Price History Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900 mb-1">Price History & Audit Trail</p>
                <p className="text-xs text-blue-700">
                  All fuel price changes are logged with timestamps, admin details, and effective dates. Historical pricing data is maintained for
                  financial reporting and compliance purposes.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}