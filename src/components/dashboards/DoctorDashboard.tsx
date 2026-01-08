import { useState } from 'react';
import { User } from '../../App';
import { DashboardLayout } from '../shared/DashboardLayout';
import { 
  Calendar,
  Users,
  ClipboardList,
  FileText,
  Activity,
  Stethoscope,
  FlaskConical,
  Pill
} from 'lucide-react';
import { AppointmentsView } from '../modules/AppointmentsView';
import { PatientRecordsView } from '../modules/PatientRecordsView';
import { LabOrdersView } from '../modules/LabOrdersView';
import { PrescriptionsView } from '../modules/PrescriptionsView';

type DoctorView = 'dashboard' | 'appointments' | 'patients' | 'lab_orders' | 'prescriptions';

interface DoctorDashboardProps {
  user: User;
  onLogout: () => void;
}

export function DoctorDashboard({ user, onLogout }: DoctorDashboardProps) {
  const [currentView, setCurrentView] = useState<DoctorView>('dashboard');

  const menuItems = [
    { id: 'dashboard' as DoctorView, label: 'Dashboard', icon: Activity },
    { id: 'appointments' as DoctorView, label: 'Appointments', icon: Calendar },
    { id: 'patients' as DoctorView, label: 'Patient Records', icon: Users },
    { id: 'lab_orders' as DoctorView, label: 'Lab Orders', icon: FlaskConical },
    { id: 'prescriptions' as DoctorView, label: 'Prescriptions', icon: Pill }
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
        return <AppointmentsView doctorId={user.id} />;
      case 'patients':
        return <PatientRecordsView doctorId={user.id} />;
      case 'lab_orders':
        return <LabOrdersView userRole="doctor" userId={user.id} />;
      case 'prescriptions':
        return <PrescriptionsView userRole="doctor" userId={user.id} />;
      default:
        return <DoctorDashboardHome />;
    }
  };

  return (
    <DashboardLayout user={user} onLogout={onLogout} sidebar={sidebar}>
      {renderContent()}
    </DashboardLayout>
  );
}

function DoctorDashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl mb-1">Clinical Overview</h3>
        <p className="text-gray-600">Today's schedule and patient summary</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={Calendar}
          label="Today's Appointments"
          value="3"
          color="blue"
        />
        <StatCard
          icon={Users}
          label="Active Patients"
          value="24"
          color="green"
        />
        <StatCard
          icon={FlaskConical}
          label="Pending Lab Results"
          value="5"
          color="yellow"
        />
        <StatCard
          icon={ClipboardList}
          label="Follow-ups Due"
          value="8"
          color="purple"
        />
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg mb-4 flex items-center gap-2">
          <Calendar className="size-5 text-blue-600" />
          Today's Schedule - December 7, 2025
        </h4>
        <div className="space-y-3">
          <ScheduleItem
            time="09:00 AM"
            patient="John Doe"
            type="Follow-up"
            status="scheduled"
          />
          <ScheduleItem
            time="10:00 AM"
            patient="Mary Smith"
            type="Routine Check"
            status="scheduled"
          />
          <ScheduleItem
            time="11:30 AM"
            patient="Robert Johnson"
            type="New Consultation"
            status="scheduled"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg mb-4">Quick Actions</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton icon={Stethoscope} label="Start Consultation" />
          <QuickActionButton icon={FlaskConical} label="Order Lab Test" />
          <QuickActionButton icon={Pill} label="Write Prescription" />
          <QuickActionButton icon={FileText} label="View Patient History" />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color]} mb-3`}>
        <Icon className="size-6" />
      </div>
      <p className="text-2xl mb-1">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

interface ScheduleItemProps {
  time: string;
  patient: string;
  type: string;
  status: 'scheduled' | 'in-progress' | 'completed';
}

function ScheduleItem({ time, patient, type, status }: ScheduleItemProps) {
  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700',
    'in-progress': 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700'
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="text-center min-w-[80px]">
        <p className="text-sm text-gray-600">{time}</p>
      </div>
      <div className="flex-1">
        <p>{patient}</p>
        <p className="text-sm text-gray-600">{type}</p>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs ${statusColors[status]}`}>
        {status.replace('-', ' ')}
      </span>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
      <Icon className="size-6 text-blue-600" />
      <span className="text-sm text-center">{label}</span>
    </button>
  );
}
