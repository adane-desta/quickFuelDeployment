// =====================================================
// REQUEST DELIVERY FORM - STATION OWNER COMPONENT
// =====================================================
// Request fuel delivery from suppliers
// Submits to database for admin approval
// =====================================================

import React, { useState, useEffect } from 'react';
import { Truck, Calendar, DollarSign, User, Phone, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { deliveryService } from '../../lib/supabase/database-advanced';
import { inventoryService, fuelTypeService } from '../../lib/supabase/database';
import { notifications, notifyError, notifyWarning } from '../../lib/utils/notifications';
import { validateEthiopianPhone, formatEthiopianPhone } from '../../lib/supabase/config';
import type { StationFuelInventory, FuelType } from '../../types/advanced';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Skeleton } from '../ui/skeleton';

interface RequestDeliveryFormProps {
  stationId: string;
  onSuccess?: () => void;
}

export function RequestDeliveryForm({ stationId, onSuccess }: RequestDeliveryFormProps) {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<StationFuelInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fuel_type_id: '',
    quantity: '',
    supplier_name: '',
    supplier_contact: '',
    expected_delivery_date: '',
    cost_per_liter: '',
    invoice_number: '',
    delivery_note: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadInventory();
  }, [stationId]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getStationInventory(stationId);
      setInventory(data);
    } catch (error) {
      notifyError('Failed to load fuel inventory', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fuel_type_id) {
      newErrors.fuel_type_id = 'Please select a fuel type';
    }

    const quantity = parseFloat(formData.quantity);
    if (!formData.quantity || isNaN(quantity) || quantity <= 0) {
      newErrors.quantity = 'Valid quantity required';
    }

    // Check against max capacity
    const selectedFuel = inventory.find((f) => f.fuel_type_id === formData.fuel_type_id);
    if (selectedFuel && quantity + selectedFuel.current_stock > selectedFuel.maximum_capacity) {
      newErrors.quantity = `Exceeds max capacity. Available space: ${
        selectedFuel.maximum_capacity - selectedFuel.current_stock
      }L`;
    }

    if (!formData.supplier_name || formData.supplier_name.length < 2) {
      newErrors.supplier_name = 'Supplier name required';
    }

    if (!formData.supplier_contact || !validateEthiopianPhone(formData.supplier_contact)) {
      newErrors.supplier_contact = 'Valid Ethiopian phone required';
    }

    if (!formData.expected_delivery_date) {
      newErrors.expected_delivery_date = 'Expected delivery date required';
    } else {
      const deliveryDate = new Date(formData.expected_delivery_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deliveryDate < today) {
        newErrors.expected_delivery_date = 'Date cannot be in the past';
      }
    }

    const costPerLiter = parseFloat(formData.cost_per_liter);
    if (formData.cost_per_liter && (isNaN(costPerLiter) || costPerLiter < 0)) {
      newErrors.cost_per_liter = 'Valid cost required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      notifyWarning('Please fix form errors');
      return;
    }

    if (!user) {
      notifyError('User not authenticated');
      return;
    }

    setSubmitting(true);
    try {
      const success = await deliveryService.requestDelivery(
        {
          station_id: stationId,
          fuel_type_id: formData.fuel_type_id,
          quantity: parseFloat(formData.quantity),
          supplier_name: formData.supplier_name,
          supplier_contact: formatEthiopianPhone(formData.supplier_contact),
          expected_delivery_date: formData.expected_delivery_date,
          cost_per_liter: formData.cost_per_liter ? parseFloat(formData.cost_per_liter) : undefined,
          invoice_number: formData.invoice_number || undefined,
          delivery_note: formData.delivery_note || undefined,
        },
        user.id
      );

      if (success) {
        notifications.delivery.requested();
        // Reset form
        setFormData({
          fuel_type_id: '',
          quantity: '',
          supplier_name: '',
          supplier_contact: '',
          expected_delivery_date: '',
          cost_per_liter: '',
          invoice_number: '',
          delivery_note: '',
        });
        setErrors({});
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      notifyError('Failed to request delivery', error);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedFuel = inventory.find((f) => f.fuel_type_id === formData.fuel_type_id);
  const availableSpace = selectedFuel
    ? selectedFuel.maximum_capacity - selectedFuel.current_stock
    : 0;

  const totalCost = formData.cost_per_liter && formData.quantity
    ? parseFloat(formData.cost_per_liter) * parseFloat(formData.quantity)
    : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Request Fuel Delivery</h2>
        <p className="text-gray-600">
          Submit a delivery request for admin approval
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fuel Selection */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Fuel Details</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fuel_type_id">Fuel Type *</Label>
              <select
                id="fuel_type_id"
                value={formData.fuel_type_id}
                onChange={(e) => setFormData({ ...formData, fuel_type_id: e.target.value })}
                className={`w-full p-2 border rounded-lg ${
                  errors.fuel_type_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select fuel type</option>
                {inventory.map((fuel) => (
                  <option key={fuel.id} value={fuel.fuel_type_id}>
                    {fuel.fuel_type_name} - Current: {fuel.current_stock}L / Max: {fuel.maximum_capacity}L
                  </option>
                ))}
              </select>
              {errors.fuel_type_id && (
                <p className="text-xs text-red-500 mt-1">{errors.fuel_type_id}</p>
              )}
            </div>

            {selectedFuel && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <p className="font-medium text-blue-900 mb-1">Current Stock Status:</p>
                <div className="grid grid-cols-2 gap-2 text-blue-800">
                  <div>
                    <span className="text-blue-600">Current:</span> {selectedFuel.current_stock}L
                  </div>
                  <div>
                    <span className="text-blue-600">Capacity:</span> {selectedFuel.maximum_capacity}L
                  </div>
                  <div className="col-span-2">
                    <span className="text-blue-600">Available Space:</span>{' '}
                    <span className="font-semibold">{availableSpace}L</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="quantity">Quantity (Liters) *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="e.g., 5000"
                className={errors.quantity ? 'border-red-500' : ''}
              />
              {errors.quantity && (
                <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>
              )}
              {selectedFuel && (
                <p className="text-xs text-gray-500 mt-1">
                  Maximum you can add: {availableSpace}L
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Supplier Information */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Supplier Information</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="supplier_name">
                <User className="size-4 inline mr-1" />
                Supplier Name *
              </Label>
              <Input
                id="supplier_name"
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                placeholder="e.g., Total Ethiopia"
                className={errors.supplier_name ? 'border-red-500' : ''}
              />
              {errors.supplier_name && (
                <p className="text-xs text-red-500 mt-1">{errors.supplier_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="supplier_contact">
                <Phone className="size-4 inline mr-1" />
                Supplier Contact *
              </Label>
              <Input
                id="supplier_contact"
                type="tel"
                value={formData.supplier_contact}
                onChange={(e) => setFormData({ ...formData, supplier_contact: e.target.value })}
                placeholder="+251 9XX XXX XXX"
                className={errors.supplier_contact ? 'border-red-500' : ''}
              />
              {errors.supplier_contact && (
                <p className="text-xs text-red-500 mt-1">{errors.supplier_contact}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Delivery Details */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Delivery Details</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="expected_delivery_date">
                <Calendar className="size-4 inline mr-1" />
                Expected Delivery Date *
              </Label>
              <Input
                id="expected_delivery_date"
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) =>
                  setFormData({ ...formData, expected_delivery_date: e.target.value })
                }
                min={new Date().toISOString().split('T')[0]}
                className={errors.expected_delivery_date ? 'border-red-500' : ''}
              />
              {errors.expected_delivery_date && (
                <p className="text-xs text-red-500 mt-1">{errors.expected_delivery_date}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cost_per_liter">
                <DollarSign className="size-4 inline mr-1" />
                Cost per Liter (Optional)
              </Label>
              <Input
                id="cost_per_liter"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost_per_liter}
                onChange={(e) => setFormData({ ...formData, cost_per_liter: e.target.value })}
                placeholder="e.g., 55.00"
                className={errors.cost_per_liter ? 'border-red-500' : ''}
              />
              {errors.cost_per_liter && (
                <p className="text-xs text-red-500 mt-1">{errors.cost_per_liter}</p>
              )}
              {totalCost > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  Total Cost: ETB {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="invoice_number">
                <FileText className="size-4 inline mr-1" />
                Invoice Number (Optional)
              </Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="e.g., INV-2024-001"
              />
            </div>

            <div>
              <Label htmlFor="delivery_note">Additional Notes (Optional)</Label>
              <Textarea
                id="delivery_note"
                value={formData.delivery_note}
                onChange={(e) => setFormData({ ...formData, delivery_note: e.target.value })}
                placeholder="Any special instructions or notes..."
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Info */}
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex gap-3">
            <AlertCircle className="size-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-900">
              <p className="font-medium mb-1">Approval Process:</p>
              <ul className="space-y-1 text-amber-800">
                <li>• Your request will be sent to system administrators</li>
                <li>• Admin will review and approve/reject the request</li>
                <li>• You'll be notified of the decision</li>
                <li>• Once approved, you can receive the delivery</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" disabled={submitting} className="flex-1" size="lg">
            {submitting ? (
              <>
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Truck className="size-5 mr-2" />
                Submit Delivery Request
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
