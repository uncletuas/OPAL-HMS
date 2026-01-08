import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { AdminSetupPage } from './components/AdminSetupPage';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { RegistrarDashboard } from './components/dashboards/RegistrarDashboard';
import { DoctorDashboard } from './components/dashboards/DoctorDashboard';
import { NurseDashboard } from './components/dashboards/NurseDashboard';
import { LabTechDashboard } from './components/dashboards/LabTechDashboard';
import { PharmacistDashboard } from './components/dashboards/PharmacistDashboard';
import { PatientPortal } from './components/dashboards/PatientPortal';
import { Toaster } from 'sonner@2.0.3';

export type UserRole = 'admin' | 'registrar' | 'doctor' | 'nurse' | 'lab_tech' | 'pharmacist' | 'patient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentRoute, setCurrentRoute] = useState<string>('login');

  // Check for existing session and route on mount
  useEffect(() => {
    // Check URL for admin setup route
    const path = window.location.pathname;
    if (path === '/admin-setup') {
      setCurrentRoute('admin-setup');
      setLoading(false);
      return;
    }

    const savedSession = localStorage.getItem('session');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedSession && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem('session');
        localStorage.removeItem('currentUser');
      }
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('session');
    localStorage.removeItem('currentUser');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading OPAL HMS...</p>
        </div>
      </div>
    );
  }

  // Show admin setup page
  if (currentRoute === 'admin-setup') {
    return (
      <>
        <Toaster position="top-right" />
        <AdminSetupPage />
      </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <Toaster position="top-right" />
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  // Route to appropriate dashboard based on role
  return (
    <>
      <Toaster position="top-right" />
      {currentUser.role === 'admin' && <AdminDashboard user={currentUser} onLogout={handleLogout} />}
      {currentUser.role === 'registrar' && <RegistrarDashboard user={currentUser} onLogout={handleLogout} />}
      {currentUser.role === 'doctor' && <DoctorDashboard user={currentUser} onLogout={handleLogout} />}
      {currentUser.role === 'nurse' && <NurseDashboard user={currentUser} onLogout={handleLogout} />}
      {currentUser.role === 'lab_tech' && <LabTechDashboard user={currentUser} onLogout={handleLogout} />}
      {currentUser.role === 'pharmacist' && <PharmacistDashboard user={currentUser} onLogout={handleLogout} />}
      {currentUser.role === 'patient' && <PatientPortal user={currentUser} onLogout={handleLogout} />}
    </>
  );
}