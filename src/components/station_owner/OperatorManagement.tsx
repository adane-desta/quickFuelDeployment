import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, ShieldOff, Mail, Phone, Calendar, Activity, X, Loader2, Copy, ChevronRight, Clock, Fuel, CheckCircle } from 'lucide-react';
import { userService } from '../../lib/supabase/database';
import { notifyError, notifyWarning } from '../../lib/utils/notifications';
import { validateEthiopianPhone, validateEmail, formatEthiopianPhone } from '../../lib/supabase/config';
import type { User } from '../../types/advanced';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { supabase } from '../../lib/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface OperatorManagementProps {
  stationId: string;
  stationName: string;
}

interface ActivityLog {
  id: string;
  type: 'dispensing' | 'reservation' | 'system';
  description: string;
  timestamp: string;
  details?: any;
}

export function OperatorManagement({ stationId, stationName }: OperatorManagementProps) {
  const [operators, setOperators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newOperatorPassword, setNewOperatorPassword] = useState('');
  const [newOperatorEmail, setNewOperatorEmail] = useState('');
  const [newOperatorName, setNewOperatorName] = useState('');
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<User | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadOperators();
  }, [stationId]);

  const loadOperators = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'operator')
        .eq('station_id', stationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOperators(data || []);
    } catch (error: any) {
      console.error('Error loading operators:', error);
      notifyError('Failed to load operators', error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOperatorActivities = async (operatorId: string) => {
    setLoadingActivities(true);
    try {
      // Fetch fuel dispensing logs
      const { data: dispensingLogs, error: dError } = await supabase
        .from('fuel_dispensing_logs')
        .select('*, reservation:reservations(*)')
        .eq('dispensed_by', operatorId)
        .order('dispensed_at', { ascending: false })
        .limit(20);
      if (dError) throw dError;

      // Fetch system activities (optional)
      const { data: sysActivities, error: sError } = await supabase
        .from('system_activity')
        .select('*')
        .eq('user_id', operatorId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (sError) throw sError;

      const formatted: ActivityLog[] = [
        ...(dispensingLogs?.map(log => ({
          id: log.id,
          type: 'dispensing',
          description: `Dispensed ${log.quantity_dispensed}L of fuel`,
          timestamp: log.dispensed_at,
          details: { reservation_id: log.reservation_id, total_amount: log.total_amount },
        })) || []),
        ...(sysActivities?.map(act => ({
          id: act.id,
          type: 'system',
          description: act.description,
          timestamp: act.created_at,
          details: act.metadata,
        })) || []),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(formatted);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load activity');
    } finally {
      setLoadingActivities(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Invalid email address';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!validateEthiopianPhone(formData.phone)) newErrors.phone = 'Invalid Ethiopian phone number (e.g., +251 912 345 678)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({ fullName: '', email: '', phone: '' });
    setErrors({});
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
    return password;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Password copied to clipboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setProcessing(true);
    try {
      const tempPassword = generateRandomPassword();
      const formattedPhone = formatEthiopianPhone(formData.phone);
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: tempPassword,
          full_name: formData.fullName,
          phone: formattedPhone,
          role: 'operator',
          station_id: stationId,
          operator_status: 'active',
          hired_date: new Date().toISOString().split('T')[0],
        },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to create operator');
      setNewOperatorPassword(tempPassword);
      setNewOperatorEmail(formData.email);
      setNewOperatorName(formData.fullName);
      setShowPasswordModal(true);
      setIsModalOpen(false);
      resetForm();
      await loadOperators();
    } catch (error: any) {
      let friendlyMessage = 'Failed to create operator. ';
      if (error.message.includes('duplicate key') || error.message.includes('already registered')) {
        friendlyMessage = 'Email already registered. Please use a different email.';
      } else {
        friendlyMessage = error.message;
      }
      notifyError(friendlyMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleBlockOperator = async (operator: User) => {
    if (!confirm(`Block ${operator.full_name}? They won't be able to login.`)) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({ operator_status: 'blocked' })
        .eq('id', operator.id);
      if (error) throw error;
      toast.success(`${operator.full_name} has been blocked.`);
      loadOperators();
    } catch (error: any) {
      notifyError('Failed to block operator', error.message);
    }
  };

  const handleUnblockOperator = async (operator: User) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ operator_status: 'active' })
        .eq('id', operator.id);
      if (error) throw error;
      toast.success(`${operator.full_name} has been unblocked.`);
      loadOperators();
    } catch (error: any) {
      notifyError('Failed to unblock operator', error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>;
      case 'blocked': return <Badge className="bg-red-100 text-red-700 border-red-200">Blocked</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const openActivityModal = async (operator: User) => {
    setSelectedOperator(operator);
    setActivityModalOpen(true);
    await loadOperatorActivities(operator.id);
  };

  const formatTimeAgo = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Operator Management</h2>
          <p className="text-gray-600">{stationName}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="size-4 mr-2" />
          Add Operator
        </Button>
      </div>

      {/* Operators List */}
      {operators.length === 0 ? (
        <Card className="p-12 text-center">
          <UserPlus className="size-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Operators</h3>
          <p className="text-gray-600 mb-4">Add operators to help manage your fuel station.</p>
          <Button onClick={() => setIsModalOpen(true)}>
            <UserPlus className="size-4 mr-2" />
            Add First Operator
          </Button>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {operators.map((operator) => (
            <Card key={operator.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {operator.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{operator.full_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(operator.operator_status!)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Operator ID</p>
                    <p className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {operator.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="size-4 text-gray-400" />
                    <span>{operator.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="size-4 text-gray-400" />
                    <span>{operator.phone}</span>
                  </div>
                  {operator.hired_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="size-4 text-gray-400" />
                      <span>Hired: {new Date(operator.hired_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex gap-2">
                  {operator.operator_status === 'active' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleBlockOperator(operator)}
                    >
                      <ShieldOff className="size-4 mr-1" /> Block
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                      onClick={() => handleUnblockOperator(operator)}
                    >
                      <Shield className="size-4 mr-1" /> Unblock
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openActivityModal(operator)}
                  >
                    <Activity className="size-4 mr-1" /> Activity
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex gap-3">
          <Shield className="size-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-900">
            <p className="font-medium mb-1">Operator Permissions:</p>
            <ul className="space-y-1 text-amber-800">
              <li>• Verify pickup codes and dispense fuel</li>
              <li>• View station inventory (read-only)</li>
              <li>• View today's reservations</li>
              <li>• Cannot edit station settings or prices</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Add Operator Modal (same style as before) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Add New Operator</h2>
                  <p className="text-sm text-purple-100">Create operator account</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <Label>Full Name *</Label>
                <Input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="John Doe" className={errors.fullName ? 'border-red-500' : ''} />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="operator@example.com" className={errors.email ? 'border-red-500' : ''} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label>Phone Number *</Label>
                <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+251 912 345 678" className={errors.phone ? 'border-red-500' : ''} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-900">
                <p className="font-medium mb-1">Account Creation:</p>
                <ul className="text-xs space-y-1 text-blue-800">
                  <li>• Auto-generated temporary password</li>
                  <li>• Operator can login immediately</li>
                  <li>• They should change password after first login</li>
                </ul>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={processing} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600">
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  Create Operator
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={processing}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">Operator Created</h2>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium mb-2">Operator Account Created Successfully</p>
                <p className="text-sm text-gray-700"><strong>Name:</strong> {newOperatorName}</p>
                <p className="text-sm text-gray-700"><strong>Email:</strong> {newOperatorEmail}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-800 mb-2">Temporary Password</p>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-mono bg-white px-3 py-2 rounded border flex-1">{newOperatorPassword}</code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(newOperatorPassword)}>
                    <Copy className="w-4 h-4" /> Copy
                  </Button>
                </div>
                <p className="text-xs text-yellow-700 mt-2">The operator can log in with this password and should change it after first login.</p>
              </div>
              <Button onClick={() => setShowPasswordModal(false)} className="w-full bg-green-600 hover:bg-green-700">Done</Button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Activity className="size-5" />
              Operator Activity: {selectedOperator?.full_name}
            </DialogTitle>
          </DialogHeader>
          {loadingActivities ? (
            <div className="py-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>
          ) : activities.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No activity recorded yet.</div>
          ) : (
            <div className="space-y-4">
              {activities.map((act) => (
                <div key={act.id} className="border-l-4 border-blue-400 pl-4 py-2 bg-gray-50 rounded-r-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{act.description}</p>
                      {act.details && (
                        <p className="text-xs text-gray-500 mt-1">
                          {act.type === 'dispensing' && `Amount: ETB ${act.details.total_amount?.toFixed(2)}`}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="size-3" /> {formatTimeAgo(act.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{new Date(act.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}