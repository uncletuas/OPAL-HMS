import { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, Search, Plus, Filter, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface AppointmentsViewProps {
  doctorId?: string;
}

export function AppointmentsView({ doctorId }: AppointmentsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/appointments`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setAppointments(data.appointments);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.patientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    const matchesDoctor = !doctorId || apt.doctorId === doctorId;
    return matchesSearch && matchesStatus && matchesDoctor;
  });

  const handleAppointmentCreated = () => {
    setShowNewAppointment(false);
    fetchAppointments();
  };

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
          <h3 className="text-xl mb-1">Appointments</h3>
          <p className="text-gray-600">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''} scheduled</p>
        </div>
        <button
          onClick={() => setShowNewAppointment(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="size-5" />
          New Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <button
            onClick={fetchAppointments}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="size-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {appointments.length === 0 ? 'No appointments scheduled yet' : 'No appointments found matching your filters'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAppointments.map((appointment) => (
            <AppointmentCard 
              key={appointment.id} 
              appointment={appointment}
              onUpdate={fetchAppointments}
            />
          ))}
        </div>
      )}

      {showNewAppointment && (
        <NewAppointmentModal 
          onClose={() => setShowNewAppointment(false)}
          onSuccess={handleAppointmentCreated}
        />
      )}
    </div>
  );
}

function AppointmentCard({ appointment, onUpdate }: { appointment: any; onUpdate: () => void }) {
  const statusColors = {
    'Scheduled': 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-yellow-100 text-yellow-700',
    'Completed': 'bg-green-100 text-green-700',
    'Cancelled': 'bg-red-100 text-red-700',
    'No Show': 'bg-gray-100 text-gray-700'
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white">
            {appointment.patientName?.charAt(0) || 'P'}
          </div>
          <div>
            <h4 className="text-lg">{appointment.patientName}</h4>
            <p className="text-sm text-gray-600">MRN: {appointment.patientMrn || appointment.patientId}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${statusColors[appointment.status] || 'bg-gray-100 text-gray-700'}`}>
          {appointment.status || 'Scheduled'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="size-4 text-gray-400" />
          <span>{formatDate(appointment.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="size-4 text-gray-400" />
          <span>{appointment.time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="size-4 text-gray-400" />
          <span>{appointment.doctorName || 'Dr. TBD'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="size-4 text-gray-400" />
          <span>{appointment.department || 'General'}</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-sm text-gray-600 mb-1">Appointment Type</p>
        <p>{appointment.type || 'General Consultation'}</p>
        {appointment.notes && (
          <>
            <p className="text-sm text-gray-600 mt-2 mb-1">Notes</p>
            <p className="text-sm">{appointment.notes}</p>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          View Details
        </button>
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Reschedule
        </button>
        <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

function NewAppointmentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    type: 'General Consultation',
    department: '',
    notes: '',
    status: 'Scheduled'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const [patientsRes, staffRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/patients`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/staff`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
      ]);

      const patientsData = await patientsRes.json();
      const staffData = await staffRes.json();

      if (patientsData.success) {
        setPatients(patientsData.patients);
      }
      if (staffData.success) {
        // Filter doctors only
        const doctorList = staffData.staff.filter((s: any) => s.role === 'doctor');
        setDoctors(doctorList);

        // Get unique departments from staff
        const deptList = [...new Set(staffData.staff.map((s: any) => s.department).filter(Boolean))];
        setDepartments(deptList);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const selectedPatient = patients.find(p => p.id === formData.patientId);
      
      if (!selectedPatient) {
        throw new Error('Please select a patient');
      }

      const appointmentData = {
        ...formData,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        patientMrn: selectedPatient.mrn,
        doctorId: session.user?.id || 'doctor-1'
      };
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(appointmentData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create appointment');
      }
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
      
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      setError(err.message || 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl">Schedule New Appointment</h3>
        </div>
        
        {error && (
          <div className="m-6 mb-0 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="size-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="m-6 mb-0 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-800">Appointment created successfully!</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Patient *</label>
            <select 
              required
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select patient...</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} ({patient.mrn})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Time *</label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Doctor *</label>
              <select
                required
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select doctor...</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.firstName} {doctor.lastName} ({doctor.department})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Department *</label>
              <select
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select department...</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Appointment Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>General Consultation</option>
              <option>Follow-up</option>
              <option>Routine Check</option>
              <option>Emergency</option>
              <option>Specialist Consultation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes or special instructions..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>
        
        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading || success}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : success ? 'Created!' : 'Schedule Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
}
