import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Glasses, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill all fields'); return; }
    const result = await login(email, password);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 relative overflow-hidden flex-col items-center justify-center px-12 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-400 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 text-center space-y-6">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto">
            <Glasses className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold">OpticalCRM</h1>
          <p className="text-lg text-primary-200 max-w-md">Complete ERP solution for your optical business. Manage products, sales, customers, and more — all in one place.</p>
          <div className="flex gap-8 justify-center pt-4">
            <div className="text-center">
              <p className="text-3xl font-bold">10x</p>
              <p className="text-sm text-primary-200">Faster</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">100%</p>
              <p className="text-sm text-primary-200">Reliable</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-sm text-primary-200">Access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface-50">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center">
              <Glasses className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-surface-900">OpticalCRM</h1>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-surface-900">Welcome back</h2>
            <p className="text-surface-500 mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@opticalcrm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-surface-400 hover:text-surface-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign In
            </Button>
          </form>

          <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
            <p className="text-xs font-medium text-primary-700 mb-2">Demo Credentials</p>
            <p className="text-xs text-primary-600">Admin: admin@opticalcrm.com / admin123</p>
            <p className="text-xs text-primary-600">Staff: staff@opticalcrm.com / staff123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
