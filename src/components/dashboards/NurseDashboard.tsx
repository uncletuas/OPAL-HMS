import { useState } from 'react';
import { User } from '../../App';
import { DashboardLayout } from '../shared/DashboardLayout';
import { 
  Activity,
  Users,
  Bed,
  ClipboardList,
  Heart
} from 'lucide-react';
import { VitalsEntryView } from '../modules/VitalsEntryView';
import { PatientListView } from '../modules/PatientListView';

type NurseView = 'dashboard' | 'vitals' | 'patients' | 'beds';

interface NurseDashboardProps {
  user: User;
  onLogout: () => void;
}

export function NurseDashboard({ user, onLogout }: NurseDashboardProps) {
  const [currentView, setCurrentView] = useState<NurseView>('dashboard');

  const menuItems = [
    { id: 'dashboard' as NurseView, label: 'Dashboard', icon: Activity },
    { id: 'vitals' as NurseView, label: 'Vital Signs', icon: Heart },
    { id: 'patients' as NurseView, label: 'My Patients', icon: Users },
    { id: 'beds' as NurseView, label: 'Bed Management', icon: Bed }
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
      case 'vitals':
        return <VitalsEntryView />;
      case 'patients':
        return <PatientListView />;
      case 'beds':
        return <BedManagementView />;
      default:
        return <NurseDashboardHome />;
    }
  };

  return (
    <DashboardLayout user={user} onLogout={onLogout} sidebar={sidebar}>
      {renderContent()}
    </DashboardLayout>
  );
}

function NurseDashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl mb-1">Nursing Dashboard</h3>
        <p className="text-gray-600">Patient care and ward management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="inline-flex p-3 rounded-lg bg-blue-50 text-blue-600 mb-3">
            <Users className="size-6" />
          </div>
          <p className="text-2xl mb-1">12</p>
          <p className="text-sm text-gray-600">Assigned Patients</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="inline-flex p-3 rounded-lg bg-green-50 text-green-600 mb-3">
            <Heart className="size-6" />
          </div>
          <p className="text-2xl mb-1">8</p>
          <p className="text-sm text-gray-600">Vitals Due</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="inline-flex p-3 rounded-lg bg-yellow-50 text-yellow-600 mb-3">
            <ClipboardList className="size-6" />
          </div>
          <p className="text-2xl mb-1">5</p>
          <p className="text-sm text-gray-600">Medications Due</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="inline-flex p-3 rounded-lg bg-purple-50 text-purple-600 mb-3">
            <Bed className="size-6" />
          </div>
          <p className="text-2xl mb-1">3</p>
          <p className="text-sm text-gray-600">Available Beds</p>
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg mb-4">Today's Priority Tasks</h4>
        <div className="space-y-3">
          <TaskItem
            title="Record vitals for John Doe"
            time="09:00 AM"
            priority="high"
          />
          <TaskItem
            title="Administer medication - Mary Smith"
            time="10:00 AM"
            priority="high"
          />
          <TaskItem
            title="Update nursing notes - Robert Johnson"
            time="11:00 AM"
            priority="medium"
          />
          <TaskItem
            title="Wound dressing change - Ward A"
            time="02:00 PM"
            priority="medium"
          />
        </div>
      </div>

      {/* Ward Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg mb-4">Ward A Overview</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl text-green-700 mb-1">3</p>
            <p className="text-sm text-green-700">Available</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl text-blue-700 mb-1">9</p>
            <p className="text-sm text-blue-700">Occupied</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl text-yellow-700 mb-1">1</p>
            <p className="text-sm text-yellow-700">Reserved</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskItem({ title, time, priority }: { title: string; time: string; priority: 'high' | 'medium' | 'low' }) {
  const priorityColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700'
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
      <div className="flex-1">
        <p>{title}</p>
        <p className="text-sm text-gray-600">{time}</p>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs ${priorityColors[priority]}`}>
        {priority}
      </span>
    </div>
  );
}

function BedManagementView() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl mb-1">Bed Management</h3>
        <p className="text-gray-600">Monitor and manage ward beds</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg mb-4">Ward A Beds</h4>
        <div className="grid grid-cols-4 gap-4">
          <BedCard bedNumber="A-101" status="Occupied" patientName="John Doe" />
          <BedCard bedNumber="A-102" status="Available" />
          <BedCard bedNumber="A-103" status="Available" />
          <BedCard bedNumber="A-104" status="Reserved" />
        </div>
      </div>
    </div>
  );
}

function BedCard({ bedNumber, status, patientName }: { bedNumber: string; status: string; patientName?: string }) {
  const statusColors = {
    'Occupied': 'bg-blue-100 border-blue-300',
    'Available': 'bg-green-100 border-green-300',
    'Reserved': 'bg-yellow-100 border-yellow-300'
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${statusColors[status as keyof typeof statusColors]}`}>
      <p className="mb-2">{bedNumber}</p>
      <p className="text-sm mb-1">{status}</p>
      {patientName && <p className="text-sm">{patientName}</p>}
    </div>
  );
}
