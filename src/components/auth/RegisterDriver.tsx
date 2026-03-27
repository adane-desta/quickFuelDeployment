import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { validateEthiopianPhone, formatEthiopianPhone, validateEmail, validatePlateNumber } from '../../lib/supabase/config';
import { notifyError, notifyWarning } from '../../lib/utils/notifications';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { User, Mail, Phone, Lock, MapPin, Car, FileText } from 'lucide-react';

export function RegisterDriver() {
  const navigate = useNavigate();
  const { register } = useAuth();   // changed from signUp
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    address: '',
    vehicle_model: '',
    plate_number: '',
    license_number: '',
    preferred_fuel_type: 'Petrol',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Full name validation
    if (!formData.full_name || formData.full_name.length < 2) {
      newErrors.full_name = 'Full name is required (min 2 characters)';
    }

    // Phone validation
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!validateEthiopianPhone(formData.phone)) {
      newErrors.phone = 'Invalid Ethiopian phone format (+251 9XX XXX XXX)';
    }

    // Address validation
    if (!formData.address) {
      newErrors.address = 'Address is required';
    }

    // Vehicle model validation
    if (!formData.vehicle_model) {
      newErrors.vehicle_model = 'Vehicle model is required';
    }

    // Plate number validation
    if (!formData.plate_number) {
      newErrors.plate_number = 'Plate number is required';
    } else if (!validatePlateNumber(formData.plate_number)) {
      newErrors.plate_number = 'Invalid Ethiopian plate format (e.g., AA-3-12345)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      notifyWarning('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const success = await register({
        email: formData.email,
        password: formData.password,
        fullName: formData.full_name,
        phone: formatEthiopianPhone(formData.phone),
        role: 'driver',
        address: formData.address,
        vehicleModel: formData.vehicle_model,
        plateNumber: formData.plate_number.toUpperCase(),
        licenseNumber: formData.license_number,
        preferredFuelType: formData.preferred_fuel_type,
      });

      if (success) {
        navigate('/login');
      }
    } catch (error) {
      notifyError('Registration failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 md:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Driver Registration</h1>
          <p className="text-gray-600 text-sm">Create your QuickFuel driver account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <Label htmlFor="full_name">
              <User className="size-4 inline mr-1" />
              Full Name *
            </Label>
            <Input
              id="full_name"
              type="text"
              placeholder="John Doe"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              className={errors.full_name ? 'border-red-500' : ''}
            />
            {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">
              <Mail className="size-4 inline mr-1" />
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">
              <Phone className="size-4 inline mr-1" />
              Phone Number *
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+251 9XX XXX XXX"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            <p className="text-xs text-gray-500 mt-1">Format: +251 9XX XXX XXX or 09XX XXX XXX</p>
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address">
              <MapPin className="size-4 inline mr-1" />
              Address *
            </Label>
            <Input
              id="address"
              type="text"
              placeholder="Bole, Addis Ababa"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className={errors.address ? 'border-red-500' : ''}
            />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
          </div>

          {/* Vehicle Model */}
          <div>
            <Label htmlFor="vehicle_model">
              <Car className="size-4 inline mr-1" />
              Vehicle Model *
            </Label>
            <Input
              id="vehicle_model"
              type="text"
              placeholder="Toyota Corolla"
              value={formData.vehicle_model}
              onChange={(e) => handleChange('vehicle_model', e.target.value)}
              className={errors.vehicle_model ? 'border-red-500' : ''}
            />
            {errors.vehicle_model && <p className="text-xs text-red-500 mt-1">{errors.vehicle_model}</p>}
          </div>

          {/* Plate Number */}
          <div>
            <Label htmlFor="plate_number">
              <Car className="size-4 inline mr-1" />
              Plate Number *
            </Label>
            <Input
              id="plate_number"
              type="text"
              placeholder="AA-3-12345"
              value={formData.plate_number}
              onChange={(e) => handleChange('plate_number', e.target.value.toUpperCase())}
              className={errors.plate_number ? 'border-red-500' : ''}
            />
            {errors.plate_number && <p className="text-xs text-red-500 mt-1">{errors.plate_number}</p>}
            <p className="text-xs text-gray-500 mt-1">Format: AA-3-12345</p>
          </div>

          {/* License Number */}
          <div>
            <Label htmlFor="license_number">
              <FileText className="size-4 inline mr-1" />
              Driver's License Number
            </Label>
            <Input
              id="license_number"
              type="text"
              placeholder="Optional"
              value={formData.license_number}
              onChange={(e) => handleChange('license_number', e.target.value)}
            />
          </div>

          {/* Preferred Fuel Type */}
          <div>
            <Label htmlFor="preferred_fuel_type">Preferred Fuel Type</Label>
            <select
              id="preferred_fuel_type"
              value={formData.preferred_fuel_type}
              onChange={(e) => handleChange('preferred_fuel_type', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Benzene">Benzene</option>
              <option value="Premium Gasoline">Premium Gasoline</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">
              <Lock className="size-4 inline mr-1" />
              Password *
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 8 characters"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword">
              <Lock className="size-4 inline mr-1" />
              Confirm Password *
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              className={errors.confirmPassword ? 'border-red-500' : ''}
            />
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating Account...
              </>
            ) : (
              'Create Driver Account'
            )}
          </Button>

          {/* Login Link */}
          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-primary font-medium hover:underline"
            >
              Login here
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}