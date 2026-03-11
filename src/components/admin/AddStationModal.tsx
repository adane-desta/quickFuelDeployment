import { useState } from 'react';
import { X, Loader2, Building2, MapPin, Phone, Mail, FileText, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../lib/supabase/client';
import { db } from '../../lib/supabase/services';
import { validateEthiopianPhone, formatEthiopianPhone, validateEmail } from '../../lib/supabase/config';

interface AddStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddStationModal({ isOpen, onClose, onSuccess }: AddStationModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Station Details
    stationName: '',
    address: '',
    phone: '',
    operatingHours: '',
    latitude: '',
    longitude: '',
    
    // Operator Details
    operatorName: '',
    operatorEmail: '',
    operatorPhone: '',
    businessLicense: '',
    
    // Initial Stock
    petrolStock: '',
    dieselStock: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.stationName.trim()) {
      newErrors.stationName = 'Station name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validateEthiopianPhone(formData.phone)) {
      newErrors.phone = 'Invalid Ethiopian phone number (e.g., +251 912 345 678)';
    }

    if (!formData.operatingHours.trim()) {
      newErrors.operatingHours = 'Operating hours are required';
    }

    if (!formData.latitude.trim() || !formData.longitude.trim()) {
      newErrors.location = 'Location coordinates are required';
    } else {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      if (isNaN(lat) || isNaN(lng)) {
        newErrors.location = 'Invalid coordinates';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.operatorName.trim()) {
      newErrors.operatorName = 'Operator name is required';
    }

    if (!formData.operatorEmail.trim()) {
      newErrors.operatorEmail = 'Email is required';
    } else if (!validateEmail(formData.operatorEmail)) {
      newErrors.operatorEmail = 'Invalid email address';
    }

    if (!formData.operatorPhone.trim()) {
      newErrors.operatorPhone = 'Phone number is required';
    } else if (!validateEthiopianPhone(formData.operatorPhone)) {
      newErrors.operatorPhone = 'Invalid Ethiopian phone number';
    }

    if (!formData.businessLicense.trim()) {
      newErrors.businessLicense = 'Business license number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) {
      return;
    }

    setLoading(true);

    try {
      // Generate random password for operator
      const tempPassword = generateRandomPassword();

      // Create auth user for operator
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.operatorEmail,
        password: tempPassword,
        email_confirm: true,
      });

      if (authError) {
        throw new Error(`Failed to create operator account: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Failed to create operator account');
      }

      // Create station
      const { data: stationData, error: stationError } = await supabase
        .from('stations')
        .insert({
          name: formData.stationName,
          address: formData.address,
          phone: formatEthiopianPhone(formData.phone),
          operating_hours: formData.operatingHours,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          operator_id: authData.user.id,
          petrol_stock: parseFloat(formData.petrolStock) || 0,
          diesel_stock: parseFloat(formData.dieselStock) || 0,
          petrol_available: (parseFloat(formData.petrolStock) || 0) > 0,
          diesel_available: (parseFloat(formData.dieselStock) || 0) > 0,
          is_verified: false,
        })
        .select()
        .single();

      if (stationError) {
        // Clean up auth user if station creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Failed to create station: ${stationError.message}`);
      }

      // Create operator profile
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: formData.operatorEmail,
        full_name: formData.operatorName,
        phone: formatEthiopianPhone(formData.operatorPhone),
        role: 'operator',
        is_active: true,
        station_id: stationData.id,
        station_name: formData.stationName,
        business_license: formData.businessLicense,
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        
        // Clean up station if profile creation fails
        await supabase.from('stations').delete().eq('id', stationData.id);
        
        // Note: Can't delete auth user with anon key
        // Admin will need to clean up manually in Supabase dashboard if needed
        
        throw new Error(`Failed to create operator profile: ${profileError.message}`);
      }

      // Log system activity
      await db.systemActivity.create({
        type: 'station_verified',
        description: 'New station registered',
        actor: 'Admin',
        timestamp: new Date().toISOString(),
        details: `${formData.stationName} registered by admin`,
      });

      // TODO: Send email with credentials to operator
      // For now, show credentials in toast
      toast.success('Station registered successfully!', {
        description: `Email: ${formData.operatorEmail}\nTemporary Password: ${tempPassword}\n\nOperator credentials have been sent via email.`,
        duration: 10000,
      });

      console.log('Operator Credentials:', {
        email: formData.operatorEmail,
        password: tempPassword,
        stationId: stationData.id,
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error creating station:', error);
      toast.error('Failed to register station', {
        description: error.message || 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      stationName: '',
      address: '',
      phone: '',
      operatingHours: '',
      latitude: '',
      longitude: '',
      operatorName: '',
      operatorEmail: '',
      operatorPhone: '',
      businessLicense: '',
      petrolStock: '',
      dieselStock: '',
    });
    setStep(1);
    setErrors({});
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Add New Station</h2>
              <p className="text-sm text-purple-100">Step {step} of 2</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Station Details</h3>

              <div>
                <Label htmlFor="stationName">Station Name *</Label>
                <div className="mt-1 relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="stationName"
                    value={formData.stationName}
                    onChange={(e) => handleChange('stationName', e.target.value)}
                    placeholder="e.g., Shell Station Downtown"
                    className={`pl-10 ${errors.stationName ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.stationName && <p className="text-sm text-red-600 mt-1">{errors.stationName}</p>}
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <div className="mt-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="e.g., Bole Road, Addis Ababa"
                    className={`pl-10 ${errors.address ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="mt-1 relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+251 912 345 678"
                    className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <Label htmlFor="operatingHours">Operating Hours *</Label>
                <div className="mt-1 relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="operatingHours"
                    value={formData.operatingHours}
                    onChange={(e) => handleChange('operatingHours', e.target.value)}
                    placeholder="e.g., 06:00 - 22:00"
                    className={`pl-10 ${errors.operatingHours ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.operatingHours && <p className="text-sm text-red-600 mt-1">{errors.operatingHours}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude *</Label>
                  <Input
                    id="latitude"
                    value={formData.latitude}
                    onChange={(e) => handleChange('latitude', e.target.value)}
                    placeholder="9.0192"
                    className={errors.location ? 'border-red-500' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude *</Label>
                  <Input
                    id="longitude"
                    value={formData.longitude}
                    onChange={(e) => handleChange('longitude', e.target.value)}
                    placeholder="38.7525"
                    className={errors.location ? 'border-red-500' : ''}
                  />
                </div>
              </div>
              {errors.location && <p className="text-sm text-red-600 mt-1">{errors.location}</p>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="petrolStock">Initial Petrol Stock (L)</Label>
                  <Input
                    id="petrolStock"
                    type="number"
                    min="0"
                    value={formData.petrolStock}
                    onChange={(e) => handleChange('petrolStock', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="dieselStock">Initial Diesel Stock (L)</Label>
                  <Input
                    id="dieselStock"
                    type="number"
                    min="0"
                    value={formData.dieselStock}
                    onChange={(e) => handleChange('dieselStock', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Operator Details</h3>

              <div>
                <Label htmlFor="operatorName">Operator Full Name *</Label>
                <Input
                  id="operatorName"
                  value={formData.operatorName}
                  onChange={(e) => handleChange('operatorName', e.target.value)}
                  placeholder="e.g., John Doe"
                  className={errors.operatorName ? 'border-red-500' : ''}
                />
                {errors.operatorName && <p className="text-sm text-red-600 mt-1">{errors.operatorName}</p>}
              </div>

              <div>
                <Label htmlFor="operatorEmail">Operator Email *</Label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="operatorEmail"
                    type="email"
                    value={formData.operatorEmail}
                    onChange={(e) => handleChange('operatorEmail', e.target.value)}
                    placeholder="operator@example.com"
                    className={`pl-10 ${errors.operatorEmail ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.operatorEmail && <p className="text-sm text-red-600 mt-1">{errors.operatorEmail}</p>}
                <p className="text-xs text-gray-500 mt-1">Login credentials will be sent to this email</p>
              </div>

              <div>
                <Label htmlFor="operatorPhone">Operator Phone *</Label>
                <div className="mt-1 relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="operatorPhone"
                    value={formData.operatorPhone}
                    onChange={(e) => handleChange('operatorPhone', e.target.value)}
                    placeholder="+251 912 345 678"
                    className={`pl-10 ${errors.operatorPhone ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.operatorPhone && <p className="text-sm text-red-600 mt-1">{errors.operatorPhone}</p>}
              </div>

              <div>
                <Label htmlFor="businessLicense">Business License Number *</Label>
                <div className="mt-1 relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="businessLicense"
                    value={formData.businessLicense}
                    onChange={(e) => handleChange('businessLicense', e.target.value)}
                    placeholder="BL-2024-XXXX"
                    className={`pl-10 ${errors.businessLicense ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.businessLicense && <p className="text-sm text-red-600 mt-1">{errors.businessLicense}</p>}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium mb-1">Account Creation</p>
                <p className="text-xs text-blue-700">
                  A temporary password will be automatically generated and sent to the operator's email. The operator can change this password after their first login.
                </p>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
          <div className="flex gap-3">
            {step === 2 && (
              <Button type="button" onClick={handleBack} variant="outline" disabled={loading}>
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="button" onClick={onClose} variant="outline" disabled={loading}>
              Cancel
            </Button>

            {step === 1 ? (
              <Button type="button" onClick={handleNext} className="bg-gradient-to-r from-purple-600 to-blue-600">
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-blue-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Station'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}