import { useState } from 'react';
import { User } from '../../App';
import { DashboardLayout } from '../shared/DashboardLayout';
import { FlaskConical, Activity, Clock, CheckCircle } from 'lucide-react';
import { LabOrdersView } from '../modules/LabOrdersView';

type LabView = 'dashboard' | 'tests';

interface LabTechDashboardProps {
  user: User;
  onLogout: () => void;
}

export function LabTechDashboard({ user, onLogout }: LabTechDashboardProps) {
  const [currentView, setCurrentView] = useState<LabView>('dashboard');

  const menuItems = [
    { id: 'dashboard' as LabView, label: 'Dashboard', icon: Activity },
    { id: 'tests' as LabView, label: 'Lab Tests', icon: FlaskConical }
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
    if (currentView === 'tests') {
      return <LabOrdersView userRole="lab_tech" userId={user.id} />;
    }
    return <LabTechDashboardHome />;
  };

  return (
    <DashboardLayout user={user} onLogout={onLogout} sidebar={sidebar}>
      {renderContent()}
    </DashboardLayout>
  );
}

function LabTechDashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl mb-1">Laboratory Dashboard</h3>
        <p className="text-gray-600">Manage lab tests and results</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="inline-flex p-3 rounded-lg bg-yellow-50 text-yellow-600 mb-3">
            <Clock className="size-6" />
          </div>
          <p className="text-2xl mb-1">1</p>
          <p className="text-sm text-gray-600">Pending Tests</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="inline-flex p-3 rounded-lg bg-blue-50 text-blue-600 mb-3">
            <FlaskConical className="size-6" />
          </div>
          <p className="text-2xl mb-1">1</p>
          <p className="text-sm text-gray-600">In Progress</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="inline-flex p-3 rounded-lg bg-green-50 text-green-600 mb-3">
            <CheckCircle className="size-6" />
          </div>
          <p className="text-2xl mb-1">1</p>
          <p className="text-sm text-gray-600">Completed Today</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="inline-flex p-3 rounded-lg bg-purple-50 text-purple-600 mb-3">
            <Activity className="size-6" />
          </div>
          <p className="text-2xl mb-1">45 min</p>
          <p className="text-sm text-gray-600">Avg Turnaround Time</p>
        </div>
      </div>

      {/* Priority Tests */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg mb-4">Priority Tests</h4>
        <div className="space-y-3">
          <PriorityTestItem
            patient="John Doe"
            test="Complete Blood Count (CBC)"
            priority="STAT"
            orderedTime="2 hours ago"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg mb-4">Recent Activity</h4>
        <div className="space-y-3">
          <ActivityItem
            action="Completed"
            test="HbA1c test for Mary Smith"
            time="1 hour ago"
          />
          <ActivityItem
            action="Started Processing"
            test="CBC for John Doe"
            time="2 hours ago"
          />
        </div>
      </div>
    </div>
  );
}

function PriorityTestItem({ patient, test, priority, orderedTime }: {
  patient: string;
  test: string;
  priority: string;
  orderedTime: string;
}) {
  const priorityColors = {
    'STAT': 'bg-red-100 text-red-700',
    'Urgent': 'bg-orange-100 text-orange-700',
    'Routine': 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <p className="mb-1">{patient}</p>
        <p className="text-sm text-gray-600">{test}</p>
        <p className="text-sm text-gray-500">Ordered {orderedTime}</p>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs ${priorityColors[priority as keyof typeof priorityColors]}`}>
        {priority}
      </span>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Process
      </button>
    </div>
  );
}

function ActivityItem({ action, test, time }: {
  action: string;
  test: string;
  time: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="w-2 h-2 bg-blue-600 rounded-full" />
      <div className="flex-1">
        <p><span className="text-blue-600">{action}</span> - {test}</p>
        <p className="text-sm text-gray-500">{time}</p>
      </div>
    </div>
  );
}
