import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, ShieldOff, Mail, Phone, Calendar, Activity } from 'lucide-react';
import { userService } from '../../lib/supabase/database';
import { notifications, notifyError, notifyWarning } from '../../lib/utils/notifications';
import { validateEthiopianPhone, validateEmail, formatEthiopianPhone } from '../../lib/supabase/config';
import type { User } from '../../types/advanced';
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

interface OperatorManagementProps {
  stationId: string;
  stationName: string;
}

export function OperatorManagement({ stationId, stationName }: OperatorManagementProps) {
  const [operators, setOperators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

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
      const success = await userService.createOperator({
        email: formData.email,
        full_name: formData.full_name,
        phone: formatEthiopianPhone(formData.phone),
        station_id: stationId,
      });

      if (success) {
        notifications.operator.added(formData.full_name);
        setAddDialogOpen(false);
        setFormData({ email: '', full_name: '', phone: '' });
        setErrors({});
        loadOperators();
      }
    } catch (error) {
      notifyError('Failed to add operator', error);
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
                {errors.full_name && (
                  <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>
                )}
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
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
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
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                )}
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
                  <p className="text-xs font-mono text-gray-700">
                    {operator.id.slice(0, 8)}...
                  </p>
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
                <Button variant="outline" size="sm">
                  <Activity className="size-4 mr-2" />
                  Activity
                </Button>
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
    </div>
  );
}