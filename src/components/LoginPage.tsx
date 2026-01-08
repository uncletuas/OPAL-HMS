import { useState } from 'react';
import { User, UserRole } from '../App';
import { Hospital, Lock, Mail, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // More detailed error messages
        if (response.status === 401) {
          throw new Error('Invalid email or password. Please check your credentials.');
        } else {
          throw new Error(data.error || 'Sign in failed');
        }
      }
      
      // Store session
      localStorage.setItem('session', JSON.stringify(data.session));
      
      // Create user object
      const user: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role as UserRole,
        department: data.user.department
      };
      
      onLogin(user);
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Left side - Branding */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur">
                <Hospital className="size-8" />
              </div>
              <div>
                <h1 className="text-3xl">OPAL HMS</h1>
                <p className="text-blue-100 text-sm">Hospital Management System</p>
              </div>
            </div>
            <p className="text-lg mb-8 text-blue-50">
              Unified digital ecosystem for patient care, clinical workflows, and medical data management
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <span>Role-Based Access Control</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <span>Integrated Clinical Workflows</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <span>Real-time Patient Data</span>
              </div>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="p-12">
            <h2 className="text-2xl mb-2">Welcome Back</h2>
            <p className="text-gray-600 mb-8">Sign in to access your dashboard</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="size-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@opalhospital.com"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Admin Setup Link */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 mb-3">
                <strong>System Administrators:</strong> Setting up for the first time?
              </p>
              <a
                href="/admin-setup"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                → Initialize Hospital Management System
              </a>
            </div>

            {/* Help Text */}
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Note:</strong> Staff accounts are created by administrators. Patient accounts are created during registration by the patient registrar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}