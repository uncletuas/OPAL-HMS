import { useState } from 'react';
import { User } from '../../App';
import { DashboardLayout } from '../shared/DashboardLayout';
import { 
  Activity,
  UserPlus,
  Calendar,
  Users,
  ClipboardList
} from 'lucide-react';
import { PatientRegistrationView } from '../modules/PatientRegistrationView';
import { AppointmentsView } from '../modules/AppointmentsView';

type RegistrarView = 'dashboard' | 'register' | 'appointments' | 'patients';

interface RegistrarDashboardProps {
  user: User;
  onLogout: () => void;
}

export function RegistrarDashboard({ user, onLogout }: RegistrarDashboardProps) {
  const [currentView, setCurrentView] = useState<RegistrarView>('dashboard');

  const menuItems = [
    { id: 'dashboard' as RegistrarView, label: 'Dashboard', icon: Activity },
    { id: 'register' as RegistrarView, label: 'Register Patient', icon: UserPlus },
    { id: 'appointments' as RegistrarView, label: 'Appointments', icon: Calendar },
    { id: 'patients' as RegistrarView, label: 'Patient Records', icon: Users }
  ];

  const sidebar = (
    <div className="space-y-1">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === item.id
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon className="size-5" />
            <span className="text-sm">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'register':
        return <PatientRegistrationView />;
      case 'appointments':
        return <AppointmentsView />;
      case 'patients':
        return <PatientListSimple />;
      default:
        return <RegistrarDashboardHome />;
    }
  };

  return (
    <DashboardLayout user={user} onLogout={onLogout} sidebar={sidebar}>
      {renderContent()}
    </DashboardLayout>
  );
}

function RegistrarDashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl mb-1">Front Desk Dashboard</h3>
        <p className="text-gray-600">Patient registration and appointment management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="inline-flex p-3 rounded-lg bg-blue-50 text-blue-600 mb-3">
            <Users className="size-6" />
          </div>
          <p className="text-2xl mb-1">3</p>
          <p className="text-sm text-gray-600">Total Patients</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="inline-flex p-3 rounded-lg bg-green-50 text-green-600 mb-3">
            <UserPlus className="size-6" />
          </div>
          <p className="text-2xl mb-1">1</p>
          <p className="text-sm text-gray-600">New Registrations Today</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="inline-flex p-3 rounded-lg bg-purple-50 text-purple-600 mb-3">
            <Calendar className="size-6" />
          </div>
          <p className="text-2xl mb-1">3</p>
          <p className="text-sm text-gray-600">Today's Appointments</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="inline-flex p-3 rounded-lg bg-yellow-50 text-yellow-600 mb-3">
            <ClipboardList className="size-6" />
          </div>
          <p className="text-2xl mb-1">2</p>
          <p className="text-sm text-gray-600">Check-ins Pending</p>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg mb-4">Today's Appointments</h4>
        <div className="space-y-3">
          <AppointmentItem
            time="09:00 AM"
            patient="John Doe"
            doctor="Dr. Michael Chen"
            status="Scheduled"
          />
          <AppointmentItem
            time="10:00 AM"
            patient="Mary Smith"
            doctor="Dr. Michael Chen"
            status="Scheduled"
          />
          <AppointmentItem
            time="11:30 AM"
            patient="Robert Johnson"
            doctor="Dr. Michael Chen"
            status="Scheduled"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg mb-4">Quick Actions</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <UserPlus className="size-6 text-blue-600" />
            <span className="text-sm text-center">Register New Patient</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <Calendar className="size-6 text-blue-600" />
            <span className="text-sm text-center">Book Appointment</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <Users className="size-6 text-blue-600" />
            <span className="text-sm text-center">Search Patient</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <ClipboardList className="size-6 text-blue-600" />
            <span className="text-sm text-center">Print Patient Card</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function AppointmentItem({ time, patient, doctor, status }: {
  time: string;
  patient: string;
  doctor: string;
  status: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="text-center min-w-[80px]">
        <p className="text-sm">{time}</p>
      </div>
      <div className="flex-1">
        <p className="mb-1">{patient}</p>
        <p className="text-sm text-gray-600">{doctor}</p>
      </div>
      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
        {status}
      </span>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Check In
      </button>
    </div>
  );
}

function PatientListSimple() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl mb-1">Patient Records</h3>
        <p className="text-gray-600">View and search patient information</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-600">Patient records view would be displayed here</p>
      </div>
    </div>
  );
}
