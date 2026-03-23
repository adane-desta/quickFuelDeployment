// =====================================================
// APPROVE DELIVERIES - ADMIN COMPONENT
// =====================================================
// Admin approval workflow for fuel deliveries
// Approve/reject station owner delivery requests
// =====================================================

import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle, XCircle, Clock, Package, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { deliveryService } from '../../lib/supabase/database-advanced';
import { notifications, notifyError } from '../../lib/utils/notifications';
import type { FuelDelivery } from '../../types/advanced';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

export function ApproveDeliveries() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<FuelDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; delivery: FuelDelivery | null }>({
    open: false,
    delivery: null,
  });
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const data = await deliveryService.getPendingDeliveries();
      setDeliveries(data);
    } catch (error) {
      notifyError('Failed to load deliveries', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (delivery: FuelDelivery) => {
    if (!user) return;
    if (!confirm(`Approve delivery of ${delivery.quantity}L ${delivery.fuel_type_name}?`)) return;

    setProcessing(true);
    try {
      const success = await deliveryService.approveDelivery(delivery.id, user.id);
      if (success) {
        notifications.delivery.approved();
        loadDeliveries();
      }
    } catch (error) {
      notifyError('Failed to approve delivery', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectClick = (delivery: FuelDelivery) => {
    setRejectDialog({ open: true, delivery });
    setRejectionReason('');
  };

  const handleRejectConfirm = async () => {
    if (!user || !rejectDialog.delivery) return;
    if (!rejectionReason.trim()) {
      notifyError('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const success = await deliveryService.rejectDelivery(
        rejectDialog.delivery.id,
        rejectionReason,
        user.id
      );
      if (success) {
        notifications.delivery.rejected(rejectionReason);
        setRejectDialog({ open: false, delivery: null });
        setRejectionReason('');
        loadDeliveries();
      }
    } catch (error) {
      notifyError('Failed to reject delivery', error);
    } finally {
      setProcessing(false);
    }
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Fuel Delivery Approvals</h2>
        <p className="text-gray-600">Review and approve station fuel delivery requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="size-5 text-yellow-600" />
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <p className="text-2xl font-bold">{deliveries.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Truck className="size-5 text-blue-600" />
            <span className="text-sm text-gray-600">Total Quantity</span>
          </div>
          <p className="text-2xl font-bold">
            {deliveries.reduce((sum, d) => sum + d.quantity, 0).toLocaleString()}L
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Package className="size-5 text-purple-600" />
            <span className="text-sm text-gray-600">Stations</span>
          </div>
          <p className="text-2xl font-bold">
            {new Set(deliveries.map((d) => d.station_id)).size}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="size-5 text-red-600" />
            <span className="text-sm text-gray-600">Urgent</span>
          </div>
          <p className="text-2xl font-bold">
            {
              deliveries.filter((d) => {
                const expectedDate = new Date(d.expected_delivery_date || '');
                const daysDiff = Math.ceil(
                  (expectedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                return daysDiff <= 2;
              }).length
            }
          </p>
        </Card>
      </div>

      {/* Deliveries List */}
      {deliveries.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="size-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
          <p className="text-gray-600">No pending delivery requests at the moment.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => {
            const expectedDate = new Date(delivery.expected_delivery_date || '');
            const daysDiff = Math.ceil(
              (expectedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            const isUrgent = daysDiff <= 2;

            return (
              <Card
                key={delivery.id}
                className={`p-5 ${isUrgent ? 'border-l-4 border-l-red-500' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{delivery.station_name}</h3>
                      <Badge className="bg-yellow-600">Pending Approval</Badge>
                      {isUrgent && (
                        <Badge className="bg-red-600">
                          <AlertCircle className="size-3 mr-1" />
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Reference: {delivery.delivery_reference}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {/* Fuel Details */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Fuel Details:</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fuel Type:</span>
                        <span className="font-medium">{delivery.fuel_type_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium text-blue-600">
                          {delivery.quantity.toLocaleString()}L
                        </span>
                      </div>
                      {delivery.cost_per_liter && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cost/Liter:</span>
                            <span className="font-medium">
                              ETB {delivery.cost_per_liter.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t">
                            <span className="text-gray-600">Total Cost:</span>
                            <span className="font-semibold text-green-600">
                              ETB {(delivery.cost_per_liter * delivery.quantity).toLocaleString()}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Supplier & Timing */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Supplier & Timeline:</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Supplier:</span>
                        <span className="font-medium">{delivery.supplier_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contact:</span>
                        <span className="font-medium">{delivery.supplier_contact}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Date:</span>
                        <span className={`font-medium ${isUrgent ? 'text-red-600' : ''}`}>
                          {expectedDate.toLocaleDateString()}
                        </span>
                      </div>
                      {isUrgent && (
                        <div className="flex justify-between text-red-600">
                          <span>Days remaining:</span>
                          <span className="font-semibold">{daysDiff} day{daysDiff !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-2 mb-4">
                  {delivery.invoice_number && (
                    <div className="text-sm">
                      <span className="text-gray-600">Invoice: </span>
                      <span className="font-mono">{delivery.invoice_number}</span>
                    </div>
                  )}
                  {delivery.delivery_note && (
                    <div className="text-sm">
                      <span className="text-gray-600">Notes: </span>
                      <span>{delivery.delivery_note}</span>
                    </div>
                  )}
                  <div className="text-sm text-gray-500">
                    Requested by: {delivery.requested_by_name} on{' '}
                    {new Date(delivery.requested_at).toLocaleString()}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApprove(delivery)}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="size-4 mr-2" />
                    Approve Delivery
                  </Button>
                  <Button
                    onClick={() => handleRejectClick(delivery)}
                    disabled={processing}
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="size-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Rejection Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, delivery: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Delivery Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this delivery request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {rejectDialog.delivery && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium mb-1">{rejectDialog.delivery.station_name}</p>
                <p className="text-gray-600">
                  {rejectDialog.delivery.quantity}L {rejectDialog.delivery.fuel_type_name}
                </p>
              </div>
            )}

            <div>
              <Textarea
                placeholder="Enter rejection reason (required)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be sent to the station owner.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRejectConfirm}
                disabled={processing || !rejectionReason.trim()}
                variant="destructive"
                className="flex-1"
              >
                {processing ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
              <Button
                onClick={() => setRejectDialog({ open: false, delivery: null })}
                disabled={processing}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
