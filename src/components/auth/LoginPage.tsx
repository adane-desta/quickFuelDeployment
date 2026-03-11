import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { Fuel, Mail, Lock, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner@2.0.3';
import { validateEmail } from '../../lib/supabase/config';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Redirect based on role when user logs in
  useEffect(() => {
    if (user && !loading && !authLoading) {
      const path = `/${user.role}`;
      navigate(path, { replace: true });
    }
  }, [user, loading, authLoading, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Validation failed', {
        description: 'Please check your input and try again',
      });
      return;
    }

    setLoading(true);

    try {
      const success = await login(email, password);
      // If successful, the useEffect above will handle navigation
      if (!success) {
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  const handleFieldChange = (field: 'email' | 'password', value: string) => {
    if (field === 'email') {
      setEmail(value);
      if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
    } else {
      setPassword(value);
      if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <div className="p-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
              <Fuel className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your QuickFuel account</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="mt-2 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder="you@example.com"
                    className={`pl-10 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    disabled={loading || authLoading}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="mt-2 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    placeholder="••••••••"
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    disabled={loading || authLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Forgot Password */}
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  onClick={() => toast.info('Password reset', {
                    description: 'Please contact your administrator to reset your password',
                  })}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-6"
                disabled={loading || authLoading}
              >
                {loading || authLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/register/driver')}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Sign up as Driver
                </button>
              </p>
            </div>
          </div>

          {/* Demo Credentials Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium mb-2">Quick Access:</p>
            <div className="space-y-1 text-xs text-blue-700">
              <p>• Admin: Use the credentials you created in Supabase</p>
              <p>• Operators: Credentials sent after station registration</p>
              <p>• Drivers: Register using the sign up form</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
