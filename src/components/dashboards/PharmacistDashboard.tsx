import { useState } from 'react';
import { User } from '../../App';
import { DashboardLayout } from '../shared/DashboardLayout';
import { Pill, Activity, Package, AlertTriangle } from 'lucide-react';
import { PrescriptionsView } from '../modules/PrescriptionsView';
import { DrugInventoryView } from '../modules/DrugInventoryView';

type PharmacistView = 'dashboard' | 'prescriptions' | 'inventory';

interface PharmacistDashboardProps {
  user: User;
  onLogout: () => void;
}

export function PharmacistDashboard({ user, onLogout }: PharmacistDashboardProps) {
  const [currentView, setCurrentView] = useState<PharmacistView>('dashboard');

  const menuItems = [
    { id: 'dashboard' as PharmacistView, label: 'Dashboard', icon: Activity },
    { id: 'prescriptions' as PharmacistView, label: 'Prescriptions', icon: Pill },
    { id: 'inventory' as PharmacistView, label: 'Drug Inventory', icon: Package }
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
      case 'prescriptions':
        return <PrescriptionsView userRole="pharmacist" userId={user.id} />;
      case 'inventory':
        return <DrugInventoryView />;
      default:
        return <PharmacistDashboardHome />;
    }
  };

  return (
    <DashboardLayout user={user} onLogout={onLogout} sidebar={sidebar}>
      {renderContent()}
    </DashboardLayout>
  );
}

function PharmacistDashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl mb-1">Pharmacy Dashboard</h3>
        <p className="text-gray-600">Manage prescriptions and drug inventory</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="inline-flex p-3 rounded-lg bg-yellow-50 text-yellow-600 mb-3">
            <Pill className="size-6" />
          </div>
          <p className="text-2xl mb-1">1</p>
          <p className="text-sm text-gray-600">Pending Prescriptions</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="inline-flex p-3 rounded-lg bg-green-50 text-green-600 mb-3">
            <Pill className="size-6" />
          </div>
          <p className="text-2xl mb-1">1</p>
          <p className="text-sm text-gray-600">Dispensed Today</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="inline-flex p-3 rounded-lg bg-red-50 text-red-600 mb-3">
            <AlertTriangle className="size-6" />
          </div>
          <p className="text-2xl mb-1">1</p>
          <p className="text-sm text-gray-600">Low Stock Items</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="inline-flex p-3 rounded-lg bg-blue-50 text-blue-600 mb-3">
            <Package className="size-6" />
          </div>
          <p className="text-2xl mb-1">4</p>
          <p className="text-sm text-gray-600">Total Drug Items</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-red-900 mb-2">Low Stock Alert</h4>
            <div className="space-y-2">
              <LowStockItem drug="Aspirin 81mg" current={75} reorder={100} />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Prescriptions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg mb-4">Pending Prescriptions</h4>
        <div className="space-y-3">
          <PendingPrescriptionItem
            patient="John Doe"
            doctor="Dr. Michael Chen"
            medications={2}
            time="30 minutes ago"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-lg mb-4">Quick Actions</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <Pill className="size-6 text-blue-600" />
            <span className="text-sm text-center">Dispense Medication</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <Package className="size-6 text-blue-600" />
            <span className="text-sm text-center">Update Inventory</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <AlertTriangle className="size-6 text-blue-600" />
            <span className="text-sm text-center">Stock Alerts</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <Activity className="size-6 text-blue-600" />
            <span className="text-sm text-center">View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function LowStockItem({ drug, current, reorder }: {
  drug: string;
  current: number;
  reorder: number;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
      <div>
        <p>{drug}</p>
        <p className="text-sm text-red-700">Current: {current} units (Reorder at: {reorder})</p>
      </div>
      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
        Reorder
      </button>
    </div>
  );
}

function PendingPrescriptionItem({ patient, doctor, medications, time }: {
  patient: string;
  doctor: string;
  medications: number;
  time: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <p className="mb-1">{patient}</p>
        <p className="text-sm text-gray-600">Prescribed by {doctor}</p>
        <p className="text-sm text-gray-600">{medications} medication(s) • {time}</p>
      </div>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Dispense
      </button>
    </div>
  );
}
