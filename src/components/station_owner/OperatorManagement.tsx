import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, ShieldOff, Mail, Phone, Calendar, Activity, Copy, Eye, EyeOff, X } from 'lucide-react';
import { userService } from '../../lib/supabase/database';
import { notifications, notifyError, notifyWarning, notifySuccess } from '../../lib/utils/notifications';
import { validateEthiopianPhone, validateEmail, formatEthiopianPhone } from '../../lib/supabase/config';
import type { User } from '../../types/advanced';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { toast } from 'sonner';

interface OperatorManagementProps {
  stationId: string;
  stationName: string;
}

export function OperatorManagement({ stationId, stationName }: OperatorManagementProps) {
  const [operators, setOperators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newOperatorPassword, setNewOperatorPassword] = useState('');
  const [newOperatorEmail, setNewOperatorEmail] = useState('');
  const [newOperatorName, setNewOperatorName] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadOperators();
  }, [stationId]);

  const loadOperators = async () => {
    setLoading(true);
    try {
      const data = await userService.getStationOperators(stationId);
      setOperators(data);
    } catch (error) {
      notifyError('Failed to load operators', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email || !validateEmail(formData.email)) {
      newErrors.email = 'Valid email required';
    }
    if (!formData.full_name || formData.full_name.length < 2) {
      newErrors.full_name = 'Full name required (min 2 characters)';
    }
    if (!formData.phone || !validateEthiopianPhone(formData.phone)) {
      newErrors.phone = 'Valid Ethiopian phone required (+251 9XX XXX XXX)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddOperator = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      notifyWarning('Please fix form errors');
      return;
    }

    setProcessing(true);
    try {
      const result = await userService.createOperator({
        email: formData.email,
        full_name: formData.full_name,
        phone: formatEthiopianPhone(formData.phone),
        station_id: stationId,
      });

      if (result.success && result.password) {
        setNewOperatorPassword(result.password);
        setNewOperatorEmail(formData.email);
        setNewOperatorName(formData.full_name);
        setShowPasswordModal(true);
        setAddDialogOpen(false);
        setFormData({ email: '', full_name: '', phone: '' });
        setErrors({});
        await loadOperators(); // refresh list
      } else {
        throw new Error(result.error || 'Failed to create operator');
      }
    } catch (error: any) {
      notifyError('Failed to add operator', error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleBlockOperator = async (operator: User) => {
    if (!confirm(`Block ${operator.full_name}? They won't be able to login.`)) return;

    try {
      const success = await userService.updateOperatorStatus(operator.id, 'blocked');
      if (success) {
        notifications.operator.blocked();
        loadOperators();
      }
    } catch (error) {
      notifyError('Failed to block operator', error);
    }
  };

  const handleUnblockOperator = async (operator: User) => {
    try {
      const success = await userService.updateOperatorStatus(operator.id, 'active');
      if (success) {
        notifications.operator.unblocked();
        loadOperators();
      }
    } catch (error) {
      notifyError('Failed to unblock operator', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Active</Badge>;
      case 'blocked':
        return <Badge className="bg-red-600">Blocked</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Operator Management</h2>
          <p className="text-gray-600">{stationName}</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="size-4 mr-2" />
              Add Operator
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Operator</DialogTitle>
              <DialogDescription>
                Create a new operator account. They will receive login credentials.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddOperator} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                  className={errors.full_name ? 'border-red-500' : ''}
                />
                {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="operator@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+251 9XX XXX XXX"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-900">
                <p className="font-medium mb-1">Account Creation:</p>
                <ul className="text-xs space-y-1 text-blue-800">
                  <li>• Auto-generated temporary password</li>
                  <li>• Operator can login immediately</li>
                  <li>• They should change password after first login</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={processing} className="flex-1">
                  {processing ? 'Creating...' : 'Create Operator'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Operators List */}
      {operators.length === 0 ? (
        <Card className="p-12 text-center">
          <UserPlus className="size-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Operators</h3>
          <p className="text-gray-600 mb-4">
            Add operators to help manage your fuel station.
          </p>
          <Button onClick={() => setAddDialogOpen(true)}>
            <UserPlus className="size-4 mr-2" />
            Add First Operator
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {operators.map((operator) => (
            <Card key={operator.id} className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{operator.full_name}</h3>
                  {getStatusBadge(operator.operator_status!)}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Operator ID</p>
                  <p className="text-xs font-mono text-gray-700">{operator.id.slice(0, 8)}...</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-4 text-gray-400" />
                  <span className="text-gray-700">{operator.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-gray-400" />
                  <span className="text-gray-700">{operator.phone}</span>
                </div>
                {operator.hired_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="size-4 text-gray-400" />
                    <span className="text-gray-700">
                      Hired: {new Date(operator.hired_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {operator.operator_status === 'active' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleBlockOperator(operator)}
                  >
                    <ShieldOff className="size-4 mr-2" />
                    Block
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => handleUnblockOperator(operator)}
                  >
                    <Shield className="size-4 mr-2" />
                    Unblock
                  </Button>
                )}
                <Button variant="outline" size="sm" disabled>
                  <Activity className="size-4 mr-2" />
                  Activity
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Password Modal (similar styling to AddDriverModal) */}
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
                <p className="text-xs text-yellow-700 mt-2">
                  The operator can log in with this password and should change it after first login.
                </p>
              </div>
              <Button onClick={() => setShowPasswordModal(false)} className="w-full bg-green-600 hover:bg-green-700">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}