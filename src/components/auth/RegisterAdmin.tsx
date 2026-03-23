import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, ArrowLeft, Loader2, User, Mail, Phone, ShieldCheck, Building2, CheckCircle } from 'lucide-react';

export function RegisterAdmin() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    employeeId: '',
    department: '',
    accessCode: '',
    password: '',
    confirmPassword: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone || !formData.employeeId || !formData.department) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!formData.accessCode) {
      setError('Admin access code is required.');
      return;
    }
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
        role: 'admin',
        employeeId: formData.employeeId,
        department: formData.department,
      });
      if (success) {
        navigate('/admin');
      }
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md lg:max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/login')} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl text-white">Admin Registration</h1>
            <p className="text-purple-200 text-sm">Create system administrator account</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <h3 className="text-gray-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              Administrator Details
            </h3>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-purple-800">Admin registration requires a valid employee ID and access code provided by QuickFuel management.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5 flex items-center gap-1"><User className="w-4 h-4" /> Full Name *</label>
                <input type="text" value={formData.fullName} onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="Full name" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5 flex items-center gap-1"><Mail className="w-4 h-4" /> Email *</label>
                <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)}
                  placeholder="admin@quickfuel.com" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5 flex items-center gap-1"><Phone className="w-4 h-4" /> Phone *</label>
                <input type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+251 9XX XXX XXX" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Address</label>
                <input type="text" value={formData.address} onChange={(e) => updateField('address', e.target.value)}
                  placeholder="City" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Employee ID *</label>
                <input type="text" value={formData.employeeId} onChange={(e) => updateField('employeeId', e.target.value)}
                  placeholder="e.g., EMP-001" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5 flex items-center gap-1"><Building2 className="w-4 h-4" /> Department *</label>
                <select value={formData.department} onChange={(e) => updateField('department', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none bg-white">
                  <option value="">Select department</option>
                  <option value="System Administration">System Administration</option>
                  <option value="Operations">Operations</option>
                  <option value="Customer Support">Customer Support</option>
                  <option value="Management">Management</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Admin Access Code *</label>
              <input type="text" value={formData.accessCode} onChange={(e) => updateField('accessCode', e.target.value)}
                placeholder="Enter the access code" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none" />
              <p className="text-xs text-gray-500 mt-1">Provided by QuickFuel management (use any value for demo)</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Password *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)} placeholder="Password"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none pr-12" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Confirm Password *</label>
                <input type="password" value={formData.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder="Confirm password" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none" />
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}

            <button type="submit" disabled={isLoading}
              className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Admin Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-purple-600 hover:text-purple-700">Sign In</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
