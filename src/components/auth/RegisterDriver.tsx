import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { Fuel, Eye, EyeOff, ArrowLeft, Loader2, User, Mail, Phone, MapPin, Car, CreditCard, CheckCircle } from 'lucide-react';

export function RegisterDriver() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    vehicleModel: '',
    plateNumber: '',
    licenseNumber: '',
    preferredFuelType: 'Petrol' as 'Petrol' | 'Diesel',
    password: '',
    confirmPassword: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
      setError('Please fill in all required fields.');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!formData.vehicleModel || !formData.plateNumber || !formData.licenseNumber) {
      setError('Please fill in all vehicle details.');
      return false;
    }
    setError('');
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const success = await register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        role: 'driver',
        vehicleModel: formData.vehicleModel,
        plateNumber: formData.plateNumber,
        licenseNumber: formData.licenseNumber,
        preferredFuelType: formData.preferredFuelType,
      });
      if (success) {
        navigate('/driver');
      }
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md lg:max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/login')} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl text-white">Driver Registration</h1>
            <p className="text-blue-200 text-sm">Create your QuickFuel account</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                s < step ? 'bg-green-500 text-white' :
                s === step ? 'bg-white text-blue-600' :
                'bg-white/20 text-white/60'
              }`}>
                {s < step ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={`h-0.5 flex-1 mx-2 ${s < step ? 'bg-green-400' : 'bg-white/20'}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-between mb-6 px-1">
          <span className="text-xs text-blue-200">Personal Info</span>
          <span className="text-xs text-blue-200">Vehicle Details</span>
          <span className="text-xs text-blue-200">Security</span>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
          <form onSubmit={handleRegister}>
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Information
                </h3>

                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1.5 flex items-center gap-1">
                    <Mail className="w-4 h-4" /> Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1.5 flex items-center gap-1">
                    <Phone className="w-4 h-4" /> Phone Number *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">+251</span>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value.replace(/[^0-9\s]/g, ''))}
                      placeholder="9XX XXX XXX"
                      className="w-full pl-14 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="City, Sub-city"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
                )}

                <button
                  type="button"
                  onClick={() => { if (validateStep1()) setStep(2); }}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Vehicle Details */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-green-600" />
                  Vehicle Details
                </h3>

                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Vehicle Model *</label>
                  <input
                    type="text"
                    value={formData.vehicleModel}
                    onChange={(e) => updateField('vehicleModel', e.target.value)}
                    placeholder="e.g., Toyota Corolla 2020"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Plate Number *</label>
                  <input
                    type="text"
                    value={formData.plateNumber}
                    onChange={(e) => updateField('plateNumber', e.target.value)}
                    placeholder="e.g., AA-3-12345"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Driver's License Number *</label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => updateField('licenseNumber', e.target.value)}
                    placeholder="e.g., DL-2024-78901"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1.5 flex items-center gap-1">
                    <Fuel className="w-4 h-4" /> Preferred Fuel Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['Petrol', 'Diesel'] as const).map((fuel) => (
                      <button
                        key={fuel}
                        type="button"
                        onClick={() => updateField('preferredFuelType', fuel)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          formData.preferredFuelType === fuel
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {fuel}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (validateStep2()) setStep(3); }}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Security */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  Account Security
                </h3>

                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none pr-12"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Confirm Password *</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="mt-1 w-4 h-4" defaultChecked />
                    <p className="text-xs text-gray-600">
                      I agree to the QuickFuel <span className="text-blue-600 underline">Terms of Service</span> and{' '}
                      <span className="text-blue-600 underline">Privacy Policy</span>.
                    </p>
                  </label>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-blue-600 hover:text-blue-700">
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
