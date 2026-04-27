import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { stationService } from '../../lib/supabase/database';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'sonner';
import { DollarSign, User, Fuel, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface RefundRequest {
  id: string;
  driver_name: string;
  driver_phone: string;
  fuel_type_name: string;
  quantity: number;
  total_price: number;
  refund_amount: number;
  slot_date: string;
  slot_start_time: string;
  slot_end_time: string;
  requested_at: string;
}

export function RefundRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadRefundRequests();
  }, [user]);

  const loadRefundRequests = async () => {
    setLoading(true);
    try {
      // Get owner's station
      const stations = await stationService.getOwnerStations(user.id);
      if (!stations.length) {
        setLoading(false);
        return;
      }
      const stationId = stations[0].id;

      // Fetch pending refund reservations for this station
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          quantity,
          total_price,
          refund_amount,
          slot_date,
          time_slot:time_slot_id (start_time, end_time),
          driver:driver_id (full_name, phone),
          fuel_type:fuel_type_id (name)
        `)
        .eq('station_id', stationId)
        .eq('status', 'pending_refund')
        .order('refund_requested_at', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        id: item.id,
        driver_name: item.driver?.full_name || 'Unknown',
        driver_phone: item.driver?.phone || 'N/A',
        fuel_type_name: item.fuel_type?.name || 'Unknown',
        quantity: item.quantity,
        total_price: item.total_price,
        refund_amount: item.refund_amount || item.total_price * 0.92,
        slot_date: item.slot_date,
        slot_start_time: item.time_slot?.start_time,
        slot_end_time: item.time_slot?.end_time,
        requested_at: item.refund_requested_at,
      }));
      setRequests(formatted);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load refund requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reservationId: string) => {
    setProcessing(reservationId);
    try {
      const { error } = await supabase.functions.invoke('approve-refund', {
        body: { reservationId, approvedBy: user.id },
      });
      if (error) throw error;
      toast.success('Refund approved successfully');
      // Remove from list
      setRequests(prev => prev.filter(r => r.id !== reservationId));
    } catch (error) {
      toast.error('Failed to approve refund');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Refund Requests</h2>
        <p className="text-gray-600">Approve or reject driver refund requests (8% service fee deducted)</p>
      </div>

      {requests.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="size-16 mx-auto mb-4 text-green-500" />
          <h3 className="text-xl font-semibold mb-2">No Pending Refunds</h3>
          <p className="text-gray-600">All refund requests have been processed.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map(req => (
            <Card key={req.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-yellow-100 text-yellow-700">Pending Refund</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2"><User className="size-4 text-gray-400" /><span>{req.driver_name} ({req.driver_phone})</span></div>
                    <div className="flex items-center gap-2"><Fuel className="size-4 text-gray-400" /><span>{req.fuel_type_name} – {req.quantity}L</span></div>
                    <div className="flex items-center gap-2"><Calendar className="size-4 text-gray-400" /><span>{new Date(req.slot_date).toLocaleDateString()}</span></div>
                    <div className="flex items-center gap-2"><Clock className="size-4 text-gray-400" /><span>{req.slot_start_time} – {req.slot_end_time}</span></div>
                    <div className="flex items-center gap-2"><DollarSign className="size-4 text-green-600" /><span className="font-medium">Original: ETB {req.total_price.toLocaleString()}</span></div>
                    <div className="flex items-center gap-2"><DollarSign className="size-4 text-red-600" /><span className="font-medium">Refund: ETB {req.refund_amount.toLocaleString()} (8% fee)</span></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(req.id)}
                    disabled={processing === req.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing === req.id ? 'Processing...' : 'Approve Refund'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}