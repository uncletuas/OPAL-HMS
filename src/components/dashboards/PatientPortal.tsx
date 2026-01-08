import { useState } from 'react';
import { User } from '../../App';
import { DashboardLayout } from '../shared/DashboardLayout';
import { 
  Activity,
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  MessageCircle,
  User as UserIcon
} from 'lucide-react';

type PatientView = 'dashboard' | 'appointments' | 'records' | 'prescriptions' | 'lab_results';

interface PatientPortalProps {
  user: User;
  onLogout: () => void;
}

export function PatientPortal({ user, onLogout }: PatientPortalProps) {
  const [currentView, setCurrentView] = useState<PatientView>('dashboard');

  const menuItems = [
    { id: 'dashboard' as PatientView, label: 'Dashboard', icon: Activity },
    { id: 'appointments' as PatientView, label: 'My Appointments', icon: Calendar },
    { id: 'records' as PatientView, label: 'Medical Records', icon: FileText },
    { id: 'prescriptions' as PatientView, label: 'Prescriptions', icon: Pill },
    { id: 'lab_results' as PatientView, label: 'Lab Results', icon: FlaskConical }
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
      case 'appointments':
        return <MyAppointments />;
      case 'records':
        return <MyMedicalRecords />;
      case 'prescriptions':
        return <MyPrescriptions />;
      case 'lab_results':
        return <MyLabResults />;
      default:
        return <PatientDashboardHome />;
    }
  };

  return (
    <DashboardLayout user={user} onLogout={onLogout} sidebar={sidebar}>
      {renderContent()}
    </DashboardLayout>
  );
}

function PatientDashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl mb-1">Patient Portal</h3>
        <p className="text-gray-600">Welcome to your health dashboard</p>
      </div>

      {/* Patient Info Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-xl mb-2">John Doe</h4>
            <p className="text-blue-100 mb-1">MRN: MRN2025001</p>
            <p className="text-blue-100">Date of Birth: March 15, 1985</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl backdrop-blur">
            J
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg">Upcoming Appointments</h4>
          <button className="text-sm text-blue-600 hover:underline">View All</button>
        </div>
        <div className="space-y-3">
          <AppointmentCard
            date="Dec 7, 2025"
            time="09:00 AM"
            doctor="Dr. Michael Chen"
            department="General Medicine"
            type="Follow-up"
          />
        </div>
      </div>

      {/* Recent Lab Results */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg">Recent Lab Results</h4>
          <button className="text-sm text-blue-600 hover:underline">View All</button>
        </div>
        <div className="space-y-3">
          <LabResultCard
            test="Complete Blood Count (CBC)"
            date="Dec 6, 2025"
            status="Ready to View"
          />
        </div>
      </div>

      {/* Active Prescriptions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg">Active Prescriptions</h4>
          <button className="text-sm text-blue-600 hover:underline">View All</button>
        </div>
        <div className="space-y-3">
          <PrescriptionCard
            medication="Lisinopril 10mg"
            dosage="Once daily"
            refills="2 refills left"
          />
          <PrescriptionCard
            medication="Aspirin 81mg"
            dosage="Once daily"
            refills="3 refills left"
          />
        </div>
      </div>

      {/* Health Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="text-lg mb-3 text-blue-900">Health Tip of the Day</h4>
        <p className="text-blue-800">
          Remember to take your blood pressure medication in the morning as prescribed. Regular monitoring and medication adherence are key to managing hypertension effectively.
        </p>
      </div>
    </div>
  );
}

function AppointmentCard({ date, time, doctor, department, type }: {
  date: string;
  time: string;
  doctor: string;
  department: string;
  type: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="size-4 text-gray-600" />
          <p>{date} at {time}</p>
        </div>
        <p className="text-sm text-gray-600">{doctor} - {department}</p>
        <p className="text-sm text-gray-600">{type}</p>
      </div>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        View Details
      </button>
    </div>
  );
}

function LabResultCard({ test, date, status }: {
  test: string;
  date: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <p className="mb-1">{test}</p>
        <p className="text-sm text-gray-600">{date}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
          {status}
        </span>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Download
        </button>
      </div>
    </div>
  );
}

function PrescriptionCard({ medication, dosage, refills }: {
  medication: string;
  dosage: string;
  refills: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <p className="mb-1">{medication}</p>
        <p className="text-sm text-gray-600">{dosage}</p>
        <p className="text-sm text-gray-600">{refills}</p>
      </div>
      <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
        Request Refill
      </button>
    </div>
  );
}

function MyAppointments() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl mb-1">My Appointments</h3>
        <p className="text-gray-600">View and manage your appointments</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-600">Your appointments will be displayed here</p>
      </div>
    </div>
  );
}

function MyMedicalRecords() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl mb-1">Medical Records</h3>
        <p className="text-gray-600">View your medical history and records</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg mb-4">Personal Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Blood Group</p>
            <p>O+</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Allergies</p>
            <p className="text-red-600">Penicillin</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Chronic Conditions</p>
            <p>Hypertension</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Primary Doctor</p>
            <p>Dr. Michael Chen</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyPrescriptions() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl mb-1">My Prescriptions</h3>
        <p className="text-gray-600">View your current and past prescriptions</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-600">Your prescriptions will be displayed here</p>
      </div>
    </div>
  );
}

function MyLabResults() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl mb-1">Lab Results</h3>
        <p className="text-gray-600">View and download your lab test results</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-600">Your lab results will be displayed here</p>
      </div>
    </div>
  );
}
