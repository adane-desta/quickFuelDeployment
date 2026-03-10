import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { Fuel, Eye, EyeOff, User, Building2, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('driver');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    { id: 'driver' as UserRole, label: 'Driver', icon: User, description: 'Find stations & reserve fuel', color: 'blue' },
    { id: 'operator' as UserRole, label: 'Operator', icon: Building2, description: 'Manage your fuel station', color: 'green' },
    { id: 'admin' as UserRole, label: 'Admin', icon: ShieldCheck, description: 'System administration', color: 'purple' },
  ];

  const demoCredentials: Record<UserRole, { email: string; password: string }> = {
    driver: { email: 'abebe.kebede@email.com', password: 'demo123' },
    operator: { email: 'mulugeta.b@email.com', password: 'demo123' },
    admin: { email: 'admin@quickfuel.com', password: 'demo123' },
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password, selectedRole);
      if (success) {
        switch (selectedRole) {
          case 'driver': navigate('/driver'); break;
          case 'operator': navigate('/operator'); break;
          case 'admin': navigate('/admin'); break;
        }
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    const creds = demoCredentials[selectedRole];
    setEmail(creds.email);
    setPassword(creds.password);
    setIsLoading(true);
    setError('');

    try {
      const success = await login(creds.email, creds.password, selectedRole);
      if (success) {
        switch (selectedRole) {
          case 'driver': navigate('/driver'); break;
          case 'operator': navigate('/operator'); break;
          case 'admin': navigate('/admin'); break;
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const roleColors = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', activeBg: 'bg-blue-600' },
    green: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', activeBg: 'bg-green-600' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700', activeBg: 'bg-purple-600' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md lg:max-w-lg">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Fuel className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl text-white mb-2">QuickFuel</h1>
          <p className="text-blue-200">Reduce congestion. Save time. Get fuel faster.</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
          <h2 className="text-gray-900 text-center mb-6">Sign In</h2>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm text-gray-600 mb-3">Select your role</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((role) => {
                const Icon = role.icon;
                const isActive = selectedRole === role.id;
                const colors = roleColors[role.color as keyof typeof roleColors];

                return (
                  <button
                    key={role.id}
                    onClick={() => { setSelectedRole(role.id); setError(''); }}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      isActive
                        ? `${colors.border} ${colors.bg}`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-1 ${isActive ? colors.text : 'text-gray-400'}`} />
                    <p className={`text-sm ${isActive ? colors.text : 'text-gray-600'}`}>{role.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <button type="button" className="text-sm text-blue-600 hover:text-blue-700">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In as {roles.find(r => r.id === selectedRole)?.label}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Demo Login */}
          <div className="mt-4">
            <button
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Try Demo ({roles.find(r => r.id === selectedRole)?.label})
            </button>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => {
                  switch (selectedRole) {
                    case 'driver': navigate('/register/driver'); break;
                    case 'operator': navigate('/register/operator'); break;
                    case 'admin': navigate('/register/admin'); break;
                  }
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                Register as {roles.find(r => r.id === selectedRole)?.label}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-200 text-sm mt-6">
          QuickFuel &copy; 2026. Reducing fuel station congestion.
        </p>
      </div>
    </div>
  );
}
