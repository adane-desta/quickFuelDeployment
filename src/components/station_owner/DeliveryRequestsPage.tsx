import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { stationService } from '../../lib/supabase/database';
import { deliveryService } from '../../lib/supabase/database-advanced';
import { notifyError } from '../../lib/utils/notifications';
import type { Station, FuelDelivery } from '../../types/advanced';
import { RequestDeliveryForm } from './RequestDeliveryForm';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Truck, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';

export function DeliveryRequestsPage() {
  const { user } = useAuth();
  const [station, setStation] = useState<Station | null>(null);
  const [deliveries, setDeliveries] = useState<FuelDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const allStations = await stationService.getAllStations();
      const ownedStation = allStations.find((s) => s.owner_id === user.id);
      
      if (ownedStation) {
        setStation(ownedStation);
        const stationDeliveries = await deliveryService.getStationDeliveries(ownedStation.id);
        setDeliveries(stationDeliveries);
      }
    } catch (error) {
      notifyError('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-600"><Clock className="size-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-600"><CheckCircle className="size-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-600"><XCircle className="size-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!station) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">No station assigned to your account</p>
        </div>
      </div>
    );
  }

  if (showRequestForm) {
    return (
      <div className="p-6">
        <RequestDeliveryForm
          stationId={station.id}
          onSuccess={() => {
            setShowRequestForm(false);
            loadData();
          }}
        />
        <Button variant="outline" className="mt-4" onClick={() => setShowRequestForm(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Fuel Delivery Requests</h2>
          <p className="text-sm text-gray-600 mt-1">Manage and track your fuel deliveries</p>
        </div>
        <Button onClick={() => setShowRequestForm(true)}>
          <Plus className="size-4 mr-2" />
          New Request
        </Button>
      </div>

      {deliveries.length === 0 ? (
        <Card className="p-12 text-center">
          <Truck className="size-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Delivery Requests Yet</h3>
          <p className="text-gray-600 mb-4">Start by creating your first fuel delivery request</p>
          <Button onClick={() => setShowRequestForm(true)}>
            <Plus className="size-4 mr-2" />
            Create Request
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <Card key={delivery.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{delivery.fuel_type_name}</h3>
                    {getStatusBadge(delivery.status)}
                  </div>
                  <p className="text-sm text-gray-600">
                    Quantity: {delivery.quantity_liters} liters
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(delivery.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {delivery.supplier_name && (
                <div className="mb-2">
                  <p className="text-sm"><span className="text-gray-600">Supplier:</span> {delivery.supplier_name}</p>
                  <p className="text-sm"><span className="text-gray-600">Contact:</span> {delivery.supplier_contact}</p>
                </div>
              )}

              {delivery.admin_notes && delivery.status === 'rejected' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                  <p className="text-sm text-red-800 mt-1">{delivery.admin_notes}</p>
                </div>
              )}

              {delivery.admin_notes && delivery.status === 'approved' && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">{delivery.admin_notes}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
