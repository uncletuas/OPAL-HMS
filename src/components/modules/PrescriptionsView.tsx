import { useState, useEffect } from 'react';
import { Pill, Search, Plus, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface PrescriptionsViewProps {
  userRole: 'doctor' | 'pharmacist';
  userId: string;
}

export function PrescriptionsView({ userRole, userId }: PrescriptionsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewPrescription, setShowNewPrescription] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/prescriptions`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setPrescriptions(data.prescriptions);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrescription = async (id: string, updates: any) => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/prescriptions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      if (data.success) {
        fetchPrescriptions();
      }
    } catch (error) {
      console.error('Error updating prescription:', error);
    }
  };

  const filteredPrescriptions = prescriptions.filter(rx => {
    const matchesSearch = rx.patientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || rx.status === filterStatus;
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
          <h3 className="text-xl mb-1">Prescriptions</h3>
          <p className="text-gray-600">
            {userRole === 'doctor' ? 'Manage patient prescriptions' : 'Dispense medications'}
          </p>
        </div>
        {userRole === 'doctor' && (
          <button
            onClick={() => setShowNewPrescription(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="size-5" />
            New Prescription
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-2xl text-yellow-700 mb-1">
            {prescriptions.filter(p => p.status === 'Pending' || p.status === 'Active').length}
          </p>
          <p className="text-sm text-yellow-700">Pending</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-2xl text-blue-700 mb-1">
            {prescriptions.filter(p => p.status === 'Partially Dispensed').length}
          </p>
          <p className="text-sm text-blue-700">Partially Dispensed</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-2xl text-green-700 mb-1">
            {prescriptions.filter(p => p.status === 'Dispensed').length}
          </p>
          <p className="text-sm text-green-700">Dispensed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name..."
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
            <option value="Active">Active</option>
            <option value="Partially Dispensed">Partially Dispensed</option>
            <option value="Dispensed">Dispensed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="grid gap-4">
        {filteredPrescriptions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Pill className="size-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No prescriptions found</p>
          </div>
        ) : (
          filteredPrescriptions.map((prescription) => (
            <PrescriptionCard 
              key={prescription.id} 
              prescription={prescription}
              userRole={userRole}
              onUpdate={updatePrescription}
            />
          ))
        )}
      </div>

      {showNewPrescription && (
        <NewPrescriptionModal 
          onClose={() => setShowNewPrescription(false)}
          onSuccess={fetchPrescriptions}
        />
      )}
    </div>
  );
}

function PrescriptionCard({ 
  prescription,
  userRole,
  onUpdate
}: { 
  prescription: any;
  userRole: 'doctor' | 'pharmacist';
  onUpdate: (id: string, updates: any) => void;
}) {
  const statusConfig = {
    'Pending': { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    'Active': { color: 'bg-blue-100 text-blue-700', icon: Clock },
    'Dispensed': { color: 'bg-green-100 text-green-700', icon: CheckCircle },
    'Partially Dispensed': { color: 'bg-blue-100 text-blue-700', icon: Clock },
    'Cancelled': { color: 'bg-red-100 text-red-700', icon: XCircle }
  };

  const config = statusConfig[prescription.status as keyof typeof statusConfig] || statusConfig['Pending'];
  const StatusIcon = config.icon;

  const handleDispenseAll = () => {
    onUpdate(prescription.id, { status: 'Dispensed' });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-lg mb-1">{prescription.patientName || 'Unknown Patient'}</h4>
          <p className="text-sm text-gray-600">
            Prescription ID: {prescription.id} • Date: {prescription.prescribedAt ? new Date(prescription.prescribedAt).toLocaleDateString() : '-'}
          </p>
          <p className="text-sm text-gray-600">
            Prescribed by: {prescription.prescribedByName || prescription.doctorName || 'Unknown'}
          </p>
        </div>
        <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${config.color}`}>
          <StatusIcon className="size-4" />
          {prescription.status}
        </span>
      </div>

      {/* Medications */}
      {prescription.medications && prescription.medications.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-3">Medications</p>
          <div className="space-y-3">
            {prescription.medications.map((med: any, index: number) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="mb-1">{med.drugName || med.name} - {med.dosage}</p>
                    <p className="text-sm text-gray-600">
                      {med.frequency} for {med.duration}
                    </p>
                  </div>
                  {userRole === 'pharmacist' && (
                    med.dispensed ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        Dispensed
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                        Pending
                      </span>
                    )
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Quantity</p>
                    <p>{med.quantity} units</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Instructions</p>
                    <p>{med.instructions || '-'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {prescription.notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">{prescription.notes}</p>
        </div>
      )}

      <div className="flex gap-2">
        {userRole === 'pharmacist' && (prescription.status === 'Pending' || prescription.status === 'Active') && (
          <button 
            onClick={handleDispenseAll}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Dispense All
          </button>
        )}
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          View Details
        </button>
        {userRole === 'doctor' && (
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

function NewPrescriptionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    medications: [
      {
        drugName: '',
        dosage: '',
        frequency: 'Once daily',
        duration: '7 days',
        quantity: 1,
        instructions: ''
      }
    ],
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

    if (!formData.medications[0].drugName) {
      alert('Please add at least one medication');
      return;
    }

    setSubmitting(true);
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const patient = patients.find(p => p.id === formData.patientId);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          patientId: formData.patientId,
          patientName: `${patient.firstName} ${patient.lastName}`,
          medications: formData.medications,
          notes: formData.notes
        })
      });
      
      const data = await response.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert('Failed to create prescription');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      alert('Failed to create prescription');
    } finally {
      setSubmitting(false);
    }
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [
        ...formData.medications,
        {
          drugName: '',
          dosage: '',
          frequency: 'Once daily',
          duration: '7 days',
          quantity: 1,
          instructions: ''
        }
      ]
    });
  };

  const updateMedication = (index: number, field: string, value: any) => {
    const newMedications = [...formData.medications];
    newMedications[index] = { ...newMedications[index], [field]: value };
    setFormData({ ...formData, medications: newMedications });
  };

  const removeMedication = (index: number) => {
    if (formData.medications.length > 1) {
      setFormData({
        ...formData,
        medications: formData.medications.filter((_, i) => i !== index)
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full my-8">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl">New Prescription</h3>
        </div>
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-gray-700">Medications</label>
              <button
                type="button"
                onClick={addMedication}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Medication
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.medications.map((med, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm">Medication #{index + 1}</p>
                    {formData.medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Drug Name</label>
                      <input
                        type="text"
                        value={med.drugName}
                        onChange={(e) => updateMedication(index, 'drugName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Dosage</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        placeholder="e.g., 500mg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Frequency</label>
                      <select
                        value={med.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option>Once daily</option>
                        <option>Twice daily</option>
                        <option>Three times daily</option>
                        <option>Four times daily</option>
                        <option>Every 4 hours</option>
                        <option>Every 6 hours</option>
                        <option>As needed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Duration</label>
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={med.quantity}
                        onChange={(e) => updateMedication(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Instructions</label>
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                        placeholder="e.g., Take with food"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Clinical Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add clinical notes or special instructions..."
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
            {submitting ? 'Creating...' : 'Create Prescription'}
          </button>
        </div>
      </div>
    </div>
  );
}
