import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { toast } from 'sonner';
import { Truck, CheckCircle, XCircle, Clock, Eye, Filter, RefreshCw, AlertCircle } from 'lucide-react';

interface DeliveryRequest {
  id: string;
  station_id: string;
  station_name?: string;
  fuel_type_id: string;
  fuel_type_name?: string;
  quantity: number;
  status: string;
  supplier_name: string;
  supplier_contact: string;
  expected_delivery_date: string;
  cost_per_liter?: number;
  total_cost?: number;
  invoice_number?: string;
  delivery_note?: string;
  rejection_reason?: string;
  requested_by_name?: string;
  requested_at: string;
  approved_at?: string;
  delivered_at?: string;
}

export function DeliveryRequestsManagement() {
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'delivered'>('all');
  const [selectedRequest, setSelectedRequest] = useState<DeliveryRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('fuel_deliveries')
        .select(`
          *,
          station:stations(name),
          fuel_type:fuel_types(name, code),
          requester:users!fuel_deliveries_requested_by_fkey(full_name)
        `)
        .order('requested_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        ...item,
        station_name: item.station?.name,
        fuel_type_name: item.fuel_type?.name,
        requested_by_name: item.requester?.full_name,
      }));
      setRequests(formatted);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('fuel_deliveries')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', id);
      if (error) throw error;

      // Create notification for station owner
      const request = requests.find(r => r.id === id);
      if (request) {
        await supabase.from('notifications').insert({
          user_id: (await supabase.from('stations').select('owner_id').eq('id', request.station_id).single()).data?.owner_id,
          type: 'fuel_delivery',
          title: 'Fuel Delivery Approved',
          message: `Your delivery request for ${request.quantity}L of ${request.fuel_type_name} has been approved.`,
          priority: 'high',
          related_id: id,
          related_type: 'delivery',
        });
      }

      toast.success('Delivery request approved');
      loadRequests();
    } catch (error) {
      toast.error('Failed to approve');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('fuel_deliveries')
        .update({
          status: 'rejected',
          rejection_reason: rejectReason,
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', id);
      if (error) throw error;

      const request = requests.find(r => r.id === id);
      if (request) {
        await supabase.from('notifications').insert({
          user_id: (await supabase.from('stations').select('owner_id').eq('id', request.station_id).single()).data?.owner_id,
          type: 'fuel_delivery',
          title: 'Fuel Delivery Rejected',
          message: `Your delivery request for ${request.quantity}L of ${request.fuel_type_name} was rejected. Reason: ${rejectReason}`,
          priority: 'high',
          related_id: id,
          related_type: 'delivery',
        });
      }

      toast.success('Delivery request rejected');
      setSelectedRequest(null);
      setRejectReason('');
      loadRequests();
    } catch (error) {
      toast.error('Failed to reject');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkInTransit = async (id: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('fuel_deliveries')
        .update({ status: 'in_transit', in_transit_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast.success('Delivery marked as in transit');
      loadRequests();
    } catch (error) {
      toast.error('Failed to update');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">Pending</span>;
      case 'approved': return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">Approved</span>;
      case 'rejected': return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Rejected</span>;
      case 'in_transit': return <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">In Transit</span>;
      case 'delivered': return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Delivered</span>;
      default: return <span className="px-2 py-1 rounded-full text-xs bg-gray-100">{status}</span>;
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Fuel Delivery Requests</h1>
        <p className="text-gray-600">Manage station fuel delivery requests</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')} size="sm">All</Button>
        <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')} size="sm">Pending</Button>
        <Button variant={filter === 'approved' ? 'default' : 'outline'} onClick={() => setFilter('approved')} size="sm">Approved</Button>
        <Button variant={filter === 'rejected' ? 'default' : 'outline'} onClick={() => setFilter('rejected')} size="sm">Rejected</Button>
        <Button variant={filter === 'delivered' ? 'default' : 'outline'} onClick={() => setFilter('delivered')} size="sm">Delivered</Button>
      </div>

      {requests.length === 0 ? (
        <Card className="p-12 text-center">
          <Truck className="size-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No delivery requests found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <Card key={req.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{req.station_name}</h3>
                    {getStatusBadge(req.status)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="font-medium">Fuel:</span> {req.fuel_type_name}</div>
                    <div><span className="font-medium">Quantity:</span> {req.quantity} L</div>
                    <div><span className="font-medium">Supplier:</span> {req.supplier_name}</div>
                    <div><span className="font-medium">Requested:</span> {new Date(req.requested_at).toLocaleDateString()}</div>
                    <div><span className="font-medium">Expected:</span> {new Date(req.expected_delivery_date).toLocaleDateString()}</div>
                  </div>
                  {req.rejection_reason && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                      <span className="font-medium">Rejection reason:</span> {req.rejection_reason}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm"><Eye className="size-4 mr-1" /> Details</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader><DialogTitle>Delivery Request Details</DialogTitle></DialogHeader>
                      <div className="space-y-2 text-sm">
                        <p><strong>Station:</strong> {req.station_name}</p>
                        <p><strong>Fuel Type:</strong> {req.fuel_type_name}</p>
                        <p><strong>Quantity:</strong> {req.quantity} L</p>
                        <p><strong>Supplier:</strong> {req.supplier_name}</p>
                        <p><strong>Supplier Contact:</strong> {req.supplier_contact || 'N/A'}</p>
                        <p><strong>Expected Delivery:</strong> {new Date(req.expected_delivery_date).toLocaleDateString()}</p>
                        {req.cost_per_liter && <p><strong>Cost/Liter:</strong> ETB {req.cost_per_liter}</p>}
                        {req.total_cost && <p><strong>Total Cost:</strong> ETB {req.total_cost}</p>}
                        {req.invoice_number && <p><strong>Invoice:</strong> {req.invoice_number}</p>}
                        {req.delivery_note && <p><strong>Notes:</strong> {req.delivery_note}</p>}
                        <p><strong>Requested by:</strong> {req.requested_by_name}</p>
                        <p><strong>Requested at:</strong> {new Date(req.requested_at).toLocaleString()}</p>
                        {req.approved_at && <p><strong>Approved on:</strong> {new Date(req.approved_at).toLocaleString()}</p>}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {req.status === 'pending' && (
                    <>
                      <Button size="sm" className="bg-green-600" onClick={() => handleApprove(req.id)} disabled={processing}>
                        <CheckCircle className="size-4 mr-1" /> Approve
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="destructive"><XCircle className="size-4 mr-1" /> Reject</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Rejection Reason</DialogTitle></DialogHeader>
                          <Textarea placeholder="Provide reason for rejection" rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                          <Button onClick={() => handleReject(req.id)} disabled={processing}>Confirm Rejection</Button>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                  {req.status === 'approved' && (
                    <Button size="sm" onClick={() => handleMarkInTransit(req.id)} disabled={processing}>
                      <Truck className="size-4 mr-1" /> Mark In Transit
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}