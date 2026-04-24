import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, ShieldOff, Mail, Phone, Calendar, Activity, X, Loader2, Copy } from 'lucide-react';
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

interface OperatorManagementProps {
  stationId: string;
  stationName: string;
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
    console.log('loadoperators() is called')
    setLoading(true);
    try {
      console.log('station id sent ==== '+ stationId)
      const data = await userService.getStationOperators(stationId);
      console.log('operators returned ==== ' , data)
      setOperators(data);
    } catch (error) {
      notifyError('Failed to load operators', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validateEthiopianPhone(formData.phone)) {
      newErrors.phone = 'Invalid Ethiopian phone number (e.g., +251 912 345 678)';
    }

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

      // Use edge function for operator creation
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

      // Show password modal
      setNewOperatorPassword(tempPassword);
      setNewOperatorEmail(formData.email);
      setNewOperatorName(formData.fullName);
      setShowPasswordModal(true);
      setIsModalOpen(false);
      resetForm();
      await loadOperators(); // refresh list
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
      const success = await userService.updateOperatorStatus(operator.id, 'blocked');
      if (success) {
        toast.success(`${operator.full_name} has been blocked.`);
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
        toast.success(`${operator.full_name} has been unblocked.`);
        loadOperators();
      }
    } catch (error) {
      notifyError('Failed to unblock operator', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-600">Active</Badge>;
      case 'blocked': return <Badge className="bg-red-600">Blocked</Badge>;
      case 'pending': return <Badge className="bg-yellow-600">Pending</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Operator Management</h2>
          <p className="text-gray-600">{stationName}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
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
                    <ShieldOff className="size-4 mr-2" /> Block
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => handleUnblockOperator(operator)}
                  >
                    <Shield className="size-4 mr-2" /> Unblock
                  </Button>
                )}
                <Button variant="outline" size="sm" disabled>
                  <Activity className="size-4 mr-2" /> Activity
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

      {/* Add Operator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
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

            {/* Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  className={errors.fullName ? 'border-red-500' : ''}
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="operator@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label>Phone Number *</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+251 912 345 678"
                  className={errors.phone ? 'border-red-500' : ''}
                />
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

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={processing} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600">
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  Create Operator
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={processing}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal (after successful creation) */}
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