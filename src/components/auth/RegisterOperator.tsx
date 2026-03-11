import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, ArrowLeft, Loader2, User, Mail, Phone, MapPin, Building2, FileText, CheckCircle, Clock } from 'lucide-react';

export function RegisterOperator() {
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
    stationName: '',
    stationAddress: '',
    businessLicense: '',
    operatingHours: '',
    password: '',
    confirmPassword: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.fullName || !formData.email || !formData.phone) {
      setError('Please fill in all required fields.');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!formData.stationName || !formData.stationAddress || !formData.businessLicense) {
      setError('Please fill in all station details.');
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
        role: 'operator',
        stationName: formData.stationName,
        businessLicense: formData.businessLicense,
      });
      if (success) {
        navigate('/operator');
      }
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md lg:max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/login')} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl text-white">Operator Registration</h1>
            <p className="text-green-200 text-sm">Register your fuel station</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                s < step ? 'bg-emerald-400 text-white' :
                s === step ? 'bg-white text-green-600' :
                'bg-white/20 text-white/60'
              }`}>
                {s < step ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={`h-0.5 flex-1 mx-2 ${s < step ? 'bg-emerald-400' : 'bg-white/20'}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-between mb-6 px-1">
          <span className="text-xs text-green-200">Personal Info</span>
          <span className="text-xs text-green-200">Station Details</span>
          <span className="text-xs text-green-200">Security</span>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
          <form onSubmit={handleRegister}>
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Personal Information
                </h3>

                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Full Name *</label>
                  <input type="text" value={formData.fullName} onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder="Enter your full name" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5 flex items-center gap-1"><Mail className="w-4 h-4" /> Email *</label>
                  <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)}
                    placeholder="your.email@example.com" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5 flex items-center gap-1"><Phone className="w-4 h-4" /> Phone *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">+251</span>
                    <input type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value.replace(/[^0-9\s]/g, ''))}
                      placeholder="9XX XXX XXX" className="w-full pl-14 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5 flex items-center gap-1"><MapPin className="w-4 h-4" /> Address</label>
                  <input type="text" value={formData.address} onChange={(e) => updateField('address', e.target.value)}
                    placeholder="City, Sub-city" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" />
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}

                <button type="button" onClick={() => { if (validateStep1()) setStep(2); }}
                  className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">Continue</button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-600" />
                  Station Details
                </h3>

                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Station Name *</label>
                  <input type="text" value={formData.stationName} onChange={(e) => updateField('stationName', e.target.value)}
                    placeholder="e.g., Shell Station Downtown" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5 flex items-center gap-1"><MapPin className="w-4 h-4" /> Station Address *</label>
                  <input type="text" value={formData.stationAddress} onChange={(e) => updateField('stationAddress', e.target.value)}
                    placeholder="Full station address" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5 flex items-center gap-1"><FileText className="w-4 h-4" /> Business License Number *</label>
                  <input type="text" value={formData.businessLicense} onChange={(e) => updateField('businessLicense', e.target.value)}
                    placeholder="e.g., BL-2024-001" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5 flex items-center gap-1"><Clock className="w-4 h-4" /> Operating Hours</label>
                  <input type="text" value={formData.operatingHours} onChange={(e) => updateField('operatingHours', e.target.value)}
                    placeholder="e.g., 06:00 - 22:00" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">Your station will be reviewed and verified by QuickFuel administrators before appearing to drivers.</p>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">Back</button>
                  <button type="button" onClick={() => { if (validateStep2()) setStep(3); }}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">Continue</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Account Security
                </h3>

                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Password *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)} placeholder="Create a password"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Confirm Password *</label>
                  <input type="password" value={formData.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="Re-enter password" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="mt-1 w-4 h-4" defaultChecked />
                    <p className="text-xs text-gray-600">
                      I agree to the QuickFuel <span className="text-green-600 underline">Terms of Service</span>,{' '}
                      <span className="text-green-600 underline">Operator Agreement</span>, and{' '}
                      <span className="text-green-600 underline">Privacy Policy</span>.
                    </p>
                  </label>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">Back</button>
                  <button type="submit" disabled={isLoading}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Station'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already registered?{' '}
              <button onClick={() => navigate('/login')} className="text-green-600 hover:text-green-700">Sign In</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
