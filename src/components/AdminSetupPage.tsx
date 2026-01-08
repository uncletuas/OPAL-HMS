import { useState } from 'react';
import { Hospital, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function AdminSetupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);

  const handleSetup = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/setup/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.credentials || {
          email: 'admin@opalhospital.com',
          password: 'OpalAdmin2025!'
        });
      } else {
        setError(data.message || data.error || 'Setup completed (admin may already exist)');
      }
      
    } catch (err: any) {
      console.error('Setup error:', err);
      setError('Setup request failed. The admin account may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-4">
            <Hospital className="size-10 text-white" />
          </div>
          <h1 className="text-3xl mb-2">OPAL HMS</h1>
          <h2 className="text-xl text-gray-700 mb-2">First-Time System Setup</h2>
          <p className="text-gray-600">Initialize your Hospital Management System</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="size-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Success Display */}
        {success ? (
          <div className="space-y-6">
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="size-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg text-green-900 mb-1">Setup Complete!</h3>
                  <p className="text-sm text-green-800">Your administrator account has been created.</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email Address</p>
                  <p className="font-mono text-sm bg-gray-100 px-3 py-2 rounded border border-gray-200">{success.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Password</p>
                  <p className="font-mono text-sm bg-gray-100 px-3 py-2 rounded border border-gray-200">{success.password}</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>Important:</strong> Please save these credentials securely. You can change the password after logging in.
                </p>
              </div>
            </div>

            <a
              href="/"
              className="w-full block text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login Page
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Information */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm text-blue-900 mb-2">What will happen:</h3>
              <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                <li>A default administrator account will be created</li>
                <li>You'll receive login credentials to access the system</li>
                <li>You can create staff accounts after logging in</li>
                <li>This setup only needs to be done once</li>
              </ul>
            </div>

            {/* Setup Button */}
            <button
              onClick={handleSetup}
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Initializing System...
                </>
              ) : (
                <>
                  <Lock className="size-5" />
                  Initialize Hospital Management System
                </>
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <a
                href="/"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                ← Back to Login
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
