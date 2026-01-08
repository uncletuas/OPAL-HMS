import { useState } from 'react';
import { User } from '../../App';
import { DashboardLayout } from '../shared/DashboardLayout';
import { 
  Activity,
  Users,
  UserPlus,
  Settings,
  BarChart3,
  Bed,
  Hospital
} from 'lucide-react';
import { StaffManagementView } from '../modules/StaffManagementView';
import { AnalyticsView } from '../modules/AnalyticsView';

type AdminView = 'dashboard' | 'staff' | 'analytics' | 'settings';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');

  const menuItems = [
    { id: 'dashboard' as AdminView, label: 'Dashboard', icon: Activity },
    { id: 'staff' as AdminView, label: 'Staff Management', icon: UserPlus },
    { id: 'analytics' as AdminView, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as AdminView, label: 'System Settings', icon: Settings }
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
      case 'staff':
        return <StaffManagementView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SystemSettingsView />;
      default:
        return <AdminDashboardHome />;
    }
  };

  return (
    <DashboardLayout user={user} onLogout={onLogout} sidebar={sidebar}>
      {renderContent()}
    </DashboardLayout>
  );
}

function AdminDashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl mb-1">Hospital Administration</h3>
        <p className="text-gray-600">System overview and management</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          icon={Users}
          label="Total Patients"
          value="3"
          change="+12% this month"
          color="blue"
        />
        <MetricCard
          icon={UserPlus}
          label="Active Staff"
          value="7"
          change="All roles assigned"
          color="green"
        />
        <MetricCard
          icon={Activity}
          label="Today's Appointments"
          value="3"
          change="2 completed"
          color="purple"
        />
        <MetricCard
          icon={Bed}
          label="Bed Occupancy"
          value="75%"
          change="9 of 12 beds"
          color="yellow"
        />
      </div>

      {/* Department Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-lg mb-4">Department Status</h4>
          <div className="space-y-3">
            <DepartmentItem
              name="General Medicine"
              staff={1}
              patients={3}
              status="Active"
            />
            <DepartmentItem
              name="Laboratory"
              staff={1}
              patients={3}
              status="Active"
            />
            <DepartmentItem
              name="Pharmacy"
              staff={1}
              patients={2}
              status="Active"
            />
            <DepartmentItem
              name="Nursing - Ward A"
              staff={1}
              patients={12}
              status="Active"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-lg mb-4">Recent System Activity</h4>
          <div className="space-y-3">
            <ActivityLog
              action="New patient registered"
              user="James Wilson (Registrar)"
              time="2 hours ago"
            />
            <ActivityLog
              action="Lab test completed"
              user="David Kumar (Lab Tech)"
              time="3 hours ago"
            />
            <ActivityLog
              action="Prescription dispensed"
              user="Lisa Anderson (Pharmacist)"
              time="4 hours ago"
            />
            <ActivityLog
              action="Vitals recorded"
              user="Emily Rodriguez (Nurse)"
              time="5 hours ago"
            />
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg mb-4">System Health</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SystemHealthItem
            label="Database"
            status="Operational"
            uptime="99.9%"
            color="green"
          />
          <SystemHealthItem
            label="API Services"
            status="Operational"
            uptime="99.8%"
            color="green"
          />
          <SystemHealthItem
            label="Backup System"
            status="Last backup: 2 hours ago"
            uptime="100%"
            color="green"
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, change, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  change: string;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} mb-3`}>
        <Icon className="size-6" />
      </div>
      <p className="text-2xl mb-1">{value}</p>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-xs text-gray-500">{change}</p>
    </div>
  );
}

function DepartmentItem({ name, staff, patients, status }: {
  name: string;
  staff: number;
  patients: number;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <p className="mb-1">{name}</p>
        <p className="text-sm text-gray-600">{staff} staff • {patients} patients</p>
      </div>
      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
        {status}
      </span>
    </div>
  );
}

function ActivityLog({ action, user, time }: {
  action: string;
  user: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
      <div className="flex-1">
        <p className="text-sm mb-1">{action}</p>
        <p className="text-xs text-gray-600">{user}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
}

function SystemHealthItem({ label, status, uptime, color }: {
  label: string;
  status: string;
  uptime: string;
  color: string;
}) {
  const colorClasses = {
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700'
  };

  return (
    <div>
      <p className="mb-2">{label}</p>
      <span className={`inline-block px-3 py-1 rounded-full text-xs mb-2 ${colorClasses[color as keyof typeof colorClasses]}`}>
        {status}
      </span>
      <p className="text-sm text-gray-600">Uptime: {uptime}</p>
    </div>
  );
}

function SystemSettingsView() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl mb-1">System Settings</h3>
        <p className="text-gray-600">Configure hospital management system</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg mb-4">General Settings</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Hospital Name</label>
            <input
              type="text"
              defaultValue="Opal Hospital"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Hospital Address</label>
            <textarea
              rows={2}
              defaultValue="123 Medical Plaza, Healthcare City"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Contact Number</label>
            <input
              type="text"
              defaultValue="+1 (555) 123-4567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg mb-4">Notification Settings</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300" />
            <div>
              <p>Email Notifications</p>
              <p className="text-sm text-gray-600">Send email alerts for appointments and updates</p>
            </div>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300" />
            <div>
              <p>SMS Notifications</p>
              <p className="text-sm text-gray-600">Send SMS reminders to patients</p>
            </div>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
            <div>
              <p>WhatsApp Integration</p>
              <p className="text-sm text-gray-600">Enable WhatsApp messaging</p>
            </div>
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Save Changes
        </button>
        <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Reset to Default
        </button>
      </div>
    </div>
  );
}
