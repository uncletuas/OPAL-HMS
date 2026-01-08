import { useState, useEffect } from 'react';
import { Heart, Search, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function VitalsEntryView() {
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.firstName?.toLowerCase().includes(searchLower) ||
      patient.lastName?.toLowerCase().includes(searchLower) ||
      patient.mrn?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Patient Selection */}
      <div className="lg:col-span-1 space-y-4">
        <div>
          <h3 className="text-xl mb-1">Vital Signs Entry</h3>
          <p className="text-gray-600">Record patient vitals</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          {filteredPatients.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <p className="text-gray-600">No patients found</p>
            </div>
          ) : (
            filteredPatients.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPatient(p.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedPatient === p.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="mb-1">{p.firstName} {p.lastName}</p>
                <p className="text-sm text-gray-600">{p.mrn}</p>
                {p.assignedDoctor && <p className="text-sm text-gray-600">{p.assignedDoctor}</p>}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Vitals Entry Form */}
      <div className="lg:col-span-2">
        {selectedPatient ? (
          <VitalsForm 
            patientId={selectedPatient} 
            patients={patients}
            onSuccess={fetchPatients}
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Heart className="size-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Select a patient to record vital signs</p>
          </div>
        )}
      </div>
    </div>
  );
}

function VitalsForm({ patientId, patients, onSuccess }: { patientId: string; patients: any[]; onSuccess: () => void }) {
  const patient = patients.find(p => p.id === patientId);
  const [formData, setFormData] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    temperature: '',
    temperatureUnit: 'F',
    pulse: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      
      const bloodPressure = `${formData.bloodPressureSystolic}/${formData.bloodPressureDiastolic}`;
      const temperature = `${formData.temperature}°${formData.temperatureUnit}`;
      const pulse = `${formData.pulse} bpm`;
      const respiratoryRate = `${formData.respiratoryRate} /min`;
      const oxygenSaturation = `${formData.oxygenSaturation}%`;
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/vitals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          patientId,
          bloodPressure,
          temperature,
          pulse,
          respiratoryRate,
          oxygenSaturation,
          weight: formData.weight,
          height: formData.height,
          bmi: calculateBMI(),
          notes: formData.notes
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to record vitals');
      }
      
      setSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          bloodPressureSystolic: '',
          bloodPressureDiastolic: '',
          temperature: '',
          temperatureUnit: 'F',
          pulse: '',
          respiratoryRate: '',
          oxygenSaturation: '',
          weight: '',
          height: '',
          notes: ''
        });
        setSuccess(false);
      }, 3000);
      
      onSuccess();
      
    } catch (err: any) {
      console.error('Error recording vitals:', err);
      setError(err.message || 'Failed to record vitals');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      temperature: '',
      temperatureUnit: 'F',
      pulse: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      weight: '',
      height: '',
      notes: ''
    });
    setError('');
    setSuccess(false);
  };

  const calculateBMI = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    if (weight && height) {
      const bmi = weight / ((height / 100) ** 2);
      return bmi.toFixed(1);
    }
    return '-';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-6">
        <h4 className="text-xl mb-2">Record Vital Signs</h4>
        <p className="text-gray-600">
          Patient: {patient?.firstName} {patient?.lastName} ({patient?.mrn})
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="size-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-800">Vital signs recorded successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Blood Pressure */}
        <div>
          <label className="block text-sm text-gray-700 mb-2">Blood Pressure (mmHg)</label>
          <div className="flex gap-3 items-center">
            <input
              type="number"
              placeholder="Systolic"
              value={formData.bloodPressureSystolic}
              onChange={(e) => setFormData({ ...formData, bloodPressureSystolic: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">/</span>
            <input
              type="number"
              placeholder="Diastolic"
              value={formData.bloodPressureDiastolic}
              onChange={(e) => setFormData({ ...formData, bloodPressureDiastolic: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Temperature */}
        <div>
          <label className="block text-sm text-gray-700 mb-2">Temperature</label>
          <div className="flex gap-3">
            <input
              type="number"
              step="0.1"
              placeholder="98.6"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={formData.temperatureUnit}
              onChange={(e) => setFormData({ ...formData, temperatureUnit: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="F">°F</option>
              <option value="C">°C</option>
            </select>
          </div>
        </div>

        {/* Pulse */}
        <div>
          <label className="block text-sm text-gray-700 mb-2">Pulse (bpm)</label>
          <input
            type="number"
            placeholder="72"
            value={formData.pulse}
            onChange={(e) => setFormData({ ...formData, pulse: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Respiratory Rate */}
        <div>
          <label className="block text-sm text-gray-700 mb-2">Respiratory Rate (/min)</label>
          <input
            type="number"
            placeholder="16"
            value={formData.respiratoryRate}
            onChange={(e) => setFormData({ ...formData, respiratoryRate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Oxygen Saturation */}
        <div>
          <label className="block text-sm text-gray-700 mb-2">Oxygen Saturation (SpO2 %)</label>
          <input
            type="number"
            placeholder="98"
            value={formData.oxygenSaturation}
            onChange={(e) => setFormData({ ...formData, oxygenSaturation: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Weight & Height */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              placeholder="70"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Height (cm)</label>
            <input
              type="number"
              placeholder="170"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* BMI Display */}
        {formData.weight && formData.height && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">Calculated BMI: {calculateBMI()}</p>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm text-gray-700 mb-2">Clinical Notes</label>
          <textarea
            rows={4}
            placeholder="Add any observations or notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Recording...' : 'Record Vital Signs'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
}
