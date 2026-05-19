import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { stationService, inventoryService } from '../../lib/supabase/database';
import { deliveryService } from '../../lib/supabase/database-advanced';
import { supabase } from '../../lib/supabase/client';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { Truck, Loader2, CheckCircle, XCircle, Clock, Plus, Eye, Calendar, Fuel, X, Ban } from 'lucide-react';


interface FuelType {
  id: string;
  name: string;
  code: string;
}

interface Delivery {
  id: string;
  fuel_type_id: string;
  fuel_type_name?: string;
  quantity: number;
  status: string;
  supplier_name: string;
  expected_delivery_date: string;
  cost_per_liter?: number;
  total_cost?: number;
  rejection_reason?: string;
  requested_at: string;
  approved_at?: string;
  delivered_at?: string;
}

export function FuelDeliveryRequest() {
  const { user } = useAuth();
  const [stationId, setStationId] = useState<string | null>(null);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const stations = await stationService.getOwnerStations(user.id);
      if (!stations.length) return;
      const station = stations[0];
      setStationId(station.id);

      const { data: fuelData } = await supabase
        .from('fuel_types')
        .select('id, name, code')
        .eq('is_active', true);
      setFuelTypes(fuelData || []);

      const deliveriesData = await deliveryService.getStationDeliveries(station.id);
      setDeliveries(deliveriesData as Delivery[]);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (deliveryId: string) => {
    if (!confirm('Are you sure you want to cancel this delivery request?')) return;
    try {
      const { error } = await supabase
        .from('fuel_deliveries')
        .update({ status: 'cancelled' })
        .eq('id', deliveryId)
        .eq('status', 'pending');
      if (error) throw error;
      toast.success('Delivery request cancelled');
      loadData();
    } catch (error) {
      toast.error('Failed to cancel');
    }
  };

  const handleMarkAsDelivered = async (deliveryId: string) => {
    if (!confirm('Confirm that this delivery has been received? Fuel stock will be updated.')) return;
    try {
      const { error } = await supabase
        .from('fuel_deliveries')
        .update({ status: 'delivered', delivered_at: new Date().toISOString() })
        .eq('id', deliveryId)
        .in('status', ['approved', 'in_transit']);
      if (error) throw error;

      // Create notification for station owner (already handled by trigger? We'll add manual)
      toast.success('Delivery marked as received. Inventory updated.');
      loadData();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fuel_type_id) newErrors.fuel_type_id = 'Required';
    if (!formData.quantity || Number(formData.quantity) <= 0) newErrors.quantity = 'Valid quantity required';
    if (!formData.supplier_name.trim()) newErrors.supplier_name = 'Supplier name required';
    if (!formData.expected_delivery_date) newErrors.expected_delivery_date = 'Expected date required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !stationId) return;
    setSubmitting(true);
    try {
      const result = await deliveryService.requestDelivery(
        {
          station_id: stationId,
          fuel_type_id: formData.fuel_type_id,
          quantity: Number(formData.quantity),
          supplier_name: formData.supplier_name,
          supplier_contact: formData.supplier_contact || null,
          expected_delivery_date: formData.expected_delivery_date,
          cost_per_liter: formData.cost_per_liter ? Number(formData.cost_per_liter) : null,
          invoice_number: formData.invoice_number || null,
          delivery_note: formData.delivery_note || null,
        },
        user.id
      );
      if (result) {
        toast.success('Delivery request submitted successfully');
        setShowForm(false);
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
        loadData();
      } else {
        toast.error('Failed to submit request');
      }
    } catch (error) {
      toast.error('Error submitting request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsReceived = async (deliveryId: string) => {
    if (!confirm('Mark this delivery as received? Fuel stock will be updated automatically.')) return;
    try {
      const { error } = await supabase
        .from('fuel_deliveries')
        .update({ status: 'delivered', delivered_at: new Date().toISOString() })
        .eq('id', deliveryId)
        .eq('status', 'approved');
      if (error) throw error;
      toast.success('Delivery marked as received. Inventory updated.');
      loadData();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">Pending</span>;
      case 'approved': return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">Approved</span>;
      case 'rejected': return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Rejected</span>;
      case 'in_transit': return <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">In Transit</span>;
      case 'delivered': return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Delivered</span>;
      case 'cancelled': return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">Cancelled</span>;
      default: return <span className="px-2 py-1 rounded-full text-xs bg-gray-100">{status}</span>;
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Fuel Delivery Requests</h2>
          <p className="text-gray-600">Request fuel deliveries and track status</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-green-600">
          <Plus className="size-4 mr-2" /> New Request
        </Button>
      </div>

      {/* Request History */}
      {deliveries.length === 0 ? (
        <Card className="p-12 text-center">
          <Truck className="size-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Delivery Requests</h3>
          <p className="text-gray-600 mb-4">Request fuel deliveries for your station.</p>
          <Button onClick={() => setShowForm(true)}>Request Delivery</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {deliveries.map(delivery => (
            <Card key={delivery.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Fuel className="size-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">{delivery.fuel_type_name}</h3>
                    {getStatusBadge(delivery.status)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                    <div><span className="font-medium">Quantity:</span> {delivery.quantity} L</div>
                    <div><span className="font-medium">Supplier:</span> {delivery.supplier_name}</div>
                    <div><span className="font-medium">Requested:</span> {new Date(delivery.requested_at).toLocaleDateString()}</div>
                    <div><span className="font-medium">Expected:</span> {new Date(delivery.expected_delivery_date).toLocaleDateString()}</div>
                  </div>
                  {delivery.rejection_reason && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                      <span className="font-medium">Rejection reason:</span> {delivery.rejection_reason}
                    </div>
                  )}
                    {(delivery.status === 'approved' || delivery.status === 'in_transit') && (
                        <Button size="sm" onClick={() => handleMarkAsDelivered(delivery.id)}>
                        <CheckCircle className="size-4 mr-1" /> Mark as Received
                        </Button>
                    )}

                 {delivery.status === 'pending' && (
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleCancelRequest(delivery.id)}>
                    <Ban className="size-4 mr-1" /> Cancel
                    </Button>
                    )}
                  {delivery.status === 'delivered' && (
                    <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="size-4" /> Delivered on {new Date(delivery.delivered_at!).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white">Request Fuel Delivery</h2>
              <button onClick={() => setShowForm(false)} className="text-white hover:bg-white/10 rounded-full p-1">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <Label>Fuel Type *</Label>
                <Select value={formData.fuel_type_id} onValueChange={val => setFormData({...formData, fuel_type_id: val})}>
                  <SelectTrigger className={errors.fuel_type_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fuelTypes.map(ft => <SelectItem key={ft.id} value={ft.id}>{ft?.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity (Liters) *</Label>
                <Input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} placeholder="e.g., 5000" />
              </div>
              <div>
                <Label>Supplier Name *</Label>
                <Input value={formData.supplier_name} onChange={e => setFormData({...formData, supplier_name: e.target.value})} placeholder="e.g., Total Ethiopia" />
              </div>
              <div>
                <Label>Supplier Contact (Optional)</Label>
                <Input value={formData.supplier_contact} onChange={e => setFormData({...formData, supplier_contact: e.target.value})} placeholder="Phone or email" />
              </div>
              <div>
                <Label>Expected Delivery Date *</Label>
                <Input type="date" value={formData.expected_delivery_date} onChange={e => setFormData({...formData, expected_delivery_date: e.target.value})} />
              </div>
              <div>
                <Label>Cost per Liter (Optional)</Label>
                <Input type="number" step="0.01" value={formData.cost_per_liter} onChange={e => setFormData({...formData, cost_per_liter: e.target.value})} placeholder="ETB" />
              </div>
              <div>
                <Label>Invoice Number (Optional)</Label>
                <Input value={formData.invoice_number} onChange={e => setFormData({...formData, invoice_number: e.target.value})} />
              </div>
              <div>
                <Label>Additional Notes (Optional)</Label>
                <Textarea value={formData.delivery_note} onChange={e => setFormData({...formData, delivery_note: e.target.value})} rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                  Submit Request
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}