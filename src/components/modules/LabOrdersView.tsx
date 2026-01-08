import { useState, useEffect } from 'react';
import { FlaskConical, Search, Plus, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface LabOrdersViewProps {
  userRole: 'doctor' | 'lab_tech';
  userId: string;
}

export function LabOrdersView({ userRole, userId }: LabOrdersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [labTests, setLabTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLabOrders();
  }, []);

  const fetchLabOrders = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/lab-orders`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setLabTests(data.labOrders);
      }
    } catch (error) {
      console.error('Error fetching lab orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLabOrderStatus = async (orderId: string, updates: any) => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/lab-orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      if (data.success) {
        fetchLabOrders();
      }
    } catch (error) {
      console.error('Error updating lab order:', error);
    }
  };

  const filteredTests = labTests.filter(test => {
    const matchesSearch = test.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.testType?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || test.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl mb-1">Laboratory Orders</h3>
          <p className="text-gray-600">
            {userRole === 'doctor' ? 'Order and track lab tests' : 'Process lab tests and upload results'}
          </p>
        </div>
        {userRole === 'doctor' && (
          <button
            onClick={() => setShowNewOrder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="size-5" />
            New Lab Order
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Pending"
          value={labTests.filter(t => t.status === 'Pending').length.toString()}
          color="yellow"
        />
        <StatCard
          label="Processing"
          value={labTests.filter(t => t.status === 'Processing').length.toString()}
          color="blue"
        />
        <StatCard
          label="Completed"
          value={labTests.filter(t => t.status === 'Completed').length.toString()}
          color="green"
        />
        <StatCard
          label="Total"
          value={labTests.length.toString()}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient or test type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Lab Tests List */}
      <div className="grid gap-4">
        {filteredTests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FlaskConical className="size-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No lab tests found</p>
          </div>
        ) : (
          filteredTests.map((test) => (
            <LabTestCard 
              key={test.id} 
              test={test} 
              userRole={userRole}
              onSelect={() => setSelectedTest(test.id)}
              onUpdateStatus={updateLabOrderStatus}
            />
          ))
        )}
      </div>

      {showNewOrder && (
        <NewLabOrderModal 
          onClose={() => setShowNewOrder(false)} 
          onSuccess={fetchLabOrders}
        />
      )}
    </div>
  );
}

function LabTestCard({ 
  test, 
  userRole,
  onSelect,
  onUpdateStatus
}: { 
  test: any;
  userRole: 'doctor' | 'lab_tech';
  onSelect: () => void;
  onUpdateStatus: (id: string, updates: any) => void;
}) {
  const statusConfig = {
    'Pending': { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    'Processing': { color: 'bg-blue-100 text-blue-700', icon: FlaskConical },
    'Completed': { color: 'bg-green-100 text-green-700', icon: CheckCircle },
    'Cancelled': { color: 'bg-red-100 text-red-700', icon: AlertCircle }
  };

  const priorityColors = {
    'Routine': 'bg-gray-100 text-gray-700',
    'Urgent': 'bg-orange-100 text-orange-700',
    'STAT': 'bg-red-100 text-red-700'
  };

  const config = statusConfig[test.status as keyof typeof statusConfig] || statusConfig['Pending'];
  const StatusIcon = config.icon;

  const handleStartProcessing = () => {
    onUpdateStatus(test.id, { status: 'Processing' });
  };

  const handleUploadResults = () => {
    const result = prompt('Enter lab test results:');
    if (result) {
      onUpdateStatus(test.id, { 
        status: 'Completed', 
        result,
        completedDate: new Date().toISOString()
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-lg">{test.patientName || 'Unknown Patient'}</h4>
            {test.priority && (
              <span className={`px-2 py-1 rounded text-xs ${priorityColors[test.priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-700'}`}>
                {test.priority}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">Test ID: {test.id} • Patient ID: {test.patientId}</p>
        </div>
        <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${config.color}`}>
          <StatusIcon className="size-4" />
          {test.status}
        </span>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-600 mb-1">Test Type</p>
        <p className="mb-3">{test.testType}</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Ordered By</p>
            <p>{test.orderedByName || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-gray-600">Ordered Date</p>
            <p>{test.orderedAt ? new Date(test.orderedAt).toLocaleString() : '-'}</p>
          </div>
        </div>
        {test.completedDate && (
          <div className="mt-2">
            <p className="text-gray-600">Completed Date</p>
            <p>{new Date(test.completedDate).toLocaleString()}</p>
          </div>
        )}
      </div>

      {test.result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-800 mb-1">Result</p>
          <p className="text-green-900">{test.result}</p>
        </div>
      )}

      {test.notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">{test.notes}</p>
        </div>
      )}

      <div className="flex gap-2">
        {userRole === 'lab_tech' && test.status === 'Pending' && (
          <button 
            onClick={handleStartProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Processing
          </button>
        )}
        {userRole === 'lab_tech' && test.status === 'Processing' && (
          <button 
            onClick={handleUploadResults}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Upload Results
          </button>
        )}
        {test.status === 'Completed' && (
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            View Results
          </button>
        )}
        <button 
          onClick={onSelect}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700'
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <p className="text-2xl mb-1">{value}</p>
      <p className="text-sm">{label}</p>
    </div>
  );
}

function NewLabOrderModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    testType: 'Complete Blood Count (CBC)',
    priority: 'Routine',
    notes: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/patients`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setPatients(data.patients);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.patientId) {
      alert('Please select a patient');
      return;
    }

    setSubmitting(true);
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const patient = patients.find(p => p.id === formData.patientId);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/lab-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          patientId: formData.patientId,
          patientName: `${patient.firstName} ${patient.lastName}`,
          testType: formData.testType,
          priority: formData.priority,
          notes: formData.notes
        })
      });
      
      const data = await response.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert('Failed to create lab order');
      }
    } catch (error) {
      console.error('Error creating lab order:', error);
      alert('Failed to create lab order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl">New Lab Order</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Patient</label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <select 
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select patient...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} ({p.mrn})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Test Type</label>
            <select 
              value={formData.testType}
              onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Complete Blood Count (CBC)</option>
              <option>Lipid Panel</option>
              <option>HbA1c (Diabetes)</option>
              <option>Liver Function Test</option>
              <option>Kidney Function Test</option>
              <option>Thyroid Panel</option>
              <option>Urinalysis</option>
              <option>Electrolytes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Priority</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="priority" 
                  value="Routine" 
                  checked={formData.priority === 'Routine'}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                />
                <span>Routine</span>
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="priority" 
                  value="Urgent"
                  checked={formData.priority === 'Urgent'}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                />
                <span>Urgent</span>
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="priority" 
                  value="STAT"
                  checked={formData.priority === 'STAT'}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                />
                <span>STAT</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Clinical Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add clinical indication or special instructions..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
