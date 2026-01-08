import { useState, useEffect } from 'react';
import { Search, User, Phone, Mail, Calendar, Heart, AlertCircle, FileText, Activity, Loader2, Upload, Download, Trash2, Plus, X, Stethoscope, FlaskConical, Pill, CalendarPlus } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface PatientRecordsViewProps {
  doctorId?: string;
}

export function PatientRecordsView({ doctorId }: PatientRecordsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [patients, setPatients] = useState<any[]>([])
  const [vitals, setVitals] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showLabOrderModal, setShowLabOrderModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchVitals(selectedPatient);
      fetchMedicalReports(selectedPatient);
      fetchConsultations(selectedPatient);
    }
  }, [selectedPatient]);

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

  const fetchVitals = async (patientId: string) => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/vitals/patient/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setVitals(data.vitals);
      }
    } catch (error) {
      console.error('Error fetching vitals:', error);
    }
  };

  const fetchMedicalReports = async (patientId: string) => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/medical-reports/patient/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setReports(data.reports);
      }
    } catch (error) {
      console.error('Error fetching medical reports:', error);
    }
  };

  const fetchConsultations = async (patientId: string) => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/consultations/patient/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setConsultations(data.consultations);
      }
    } catch (error) {
      console.error('Error fetching consultations:', error);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const file = formData.get('file') as File;
    
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/medical-reports/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            patientId: selectedPatient,
            fileName: file.name,
            fileData: base64Data,
            fileType: file.type,
            reportType: formData.get('reportType'),
            description: formData.get('description')
          })
        });

        const data = await response.json();
        if (data.success) {
          toast.success('Medical report uploaded successfully');
          setShowUploadModal(false);
          fetchMedicalReports(selectedPatient);
          form.reset();
        } else {
          toast.error(data.error || 'Failed to upload report');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading report:', error);
      toast.error('Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const patient = patients.find(p => p.id === selectedPatient);
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/consultations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          patientId: selectedPatient,
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientEmail: patient.email,
          doctorName: currentUser.name,
          appointmentDate: formData.get('appointmentDate'),
          appointmentTime: formData.get('appointmentTime'),
          department: formData.get('department'),
          notes: formData.get('notes')
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Consultation scheduled successfully! Email notification sent.');
        setShowConsultationModal(false);
        fetchConsultations(selectedPatient);
        form.reset();
      } else {
        toast.error(data.error || 'Failed to create consultation');
      }
    } catch (error) {
      console.error('Error creating consultation:', error);
      toast.error('Failed to create consultation');
    }
  };

  const handleCreateLabOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const patient = patients.find(p => p.id === selectedPatient);

    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/lab-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          patientId: selectedPatient,
          patientName: `${patient.firstName} ${patient.lastName}`,
          testName: formData.get('testName'),
          testType: formData.get('testType'),
          priority: formData.get('priority'),
          notes: formData.get('notes')
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Lab order created successfully');
        setShowLabOrderModal(false);
        form.reset();
      } else {
        toast.error(data.error || 'Failed to create lab order');
      }
    } catch (error) {
      console.error('Error creating lab order:', error);
      toast.error('Failed to create lab order');
    }
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const patient = patients.find(p => p.id === selectedPatient);

    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a210bd47/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          patientId: selectedPatient,
          patientName: `${patient.firstName} ${patient.lastName}`,
          medication: formData.get('medication'),
          dosage: formData.get('dosage'),
          frequency: formData.get('frequency'),
          duration: formData.get('duration'),
          notes: formData.get('notes')
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Prescription created successfully');
        setShowPrescriptionModal(false);
        form.reset();
      } else {
        toast.error(data.error || 'Failed to create prescription');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error('Failed to create prescription');
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

  const patient = selectedPatient 
    ? patients.find(p => p.id === selectedPatient)
    : null;

  const latestVital = vitals.length > 0 ? vitals[vitals.length - 1] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <div className="lg:col-span-1 space-y-4">
          <div>
            <h3 className="text-xl mb-1">Patient Records</h3>
            <p className="text-gray-600">Search and view patient information</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or MRN..."
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
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white">
                      {p.firstName?.charAt(0) || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{p.firstName} {p.lastName}</p>
                      <p className="text-sm text-gray-600">{p.mrn}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Patient Details */}
        <div className="lg:col-span-2">
          {patient ? (
            <div className="space-y-6">
              {/* Patient Header */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl">
                      {patient.firstName?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 className="text-2xl mb-1">{patient.firstName} {patient.lastName}</h3>
                      <p className="text-gray-600">MRN: {patient.mrn}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowConsultationModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Stethoscope className="size-4" />
                      Start Consultation
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoItem icon={Calendar} label="Date of Birth" value={patient.dateOfBirth || '-'} />
                  <InfoItem icon={User} label="Gender" value={patient.gender || '-'} />
                  <InfoItem icon={Phone} label="Phone" value={patient.phone || '-'} />
                  <InfoItem icon={Mail} label="Email" value={patient.email || '-'} />
                </div>
              </div>

              {/* Alerts */}
              {(patient.allergies && patient.allergies.length > 0) || (patient.chronicConditions && patient.chronicConditions.length > 0) ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="size-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-red-900 mb-2">Medical Alerts</h4>
                      {patient.allergies && patient.allergies.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm text-red-800">
                            <strong>Allergies:</strong> {patient.allergies.join(', ')}
                          </p>
                        </div>
                      )}
                      {patient.chronicConditions && patient.chronicConditions.length > 0 && (
                        <div>
                          <p className="text-sm text-red-800">
                            <strong>Chronic Conditions:</strong> {patient.chronicConditions.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Vital Signs */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg mb-4 flex items-center gap-2">
                  <Activity className="size-5 text-blue-600" />
                  Latest Vital Signs
                </h4>
                {latestVital ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <VitalCard label="Blood Pressure" value={latestVital.bloodPressure || '-'} />
                      <VitalCard label="Temperature" value={latestVital.temperature || '-'} />
                      <VitalCard label="Pulse" value={latestVital.pulse || '-'} />
                      <VitalCard label="SpO2" value={latestVital.oxygenSaturation || '-'} />
                    </div>
                    <div className="text-sm text-gray-600">
                      Recorded by {latestVital.recordedByName || 'Unknown'} on {new Date(latestVital.recordedAt).toLocaleString()}
                    </div>
                    {latestVital.notes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">{latestVital.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">No vital signs recorded yet</p>
                )}
              </div>

              {/* Medical Reports */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg flex items-center gap-2">
                    <FileText className="size-5 text-blue-600" />
                    Medical Reports
                  </h4>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <Upload className="size-4" />
                    Upload Report
                  </button>
                </div>
                {reports.length > 0 ? (
                  <div className="space-y-2">
                    {reports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{report.fileName}</p>
                          <p className="text-xs text-gray-600">
                            {report.reportType} • Uploaded {new Date(report.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <a
                          href={report.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm flex items-center gap-1"
                        >
                          <Download className="size-4" />
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">No medical reports uploaded yet</p>
                )}
              </div>

              {/* Recent Consultations */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg mb-4 flex items-center gap-2">
                  <CalendarPlus className="size-5 text-blue-600" />
                  Recent Consultations
                </h4>
                {consultations.length > 0 ? (
                  <div className="space-y-2">
                    {consultations.slice(-3).reverse().map((consultation) => (
                      <div key={consultation.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">{consultation.doctorName}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(consultation.appointmentDate).toLocaleDateString()} at {consultation.appointmentTime}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            consultation.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {consultation.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">No consultations scheduled yet</p>
                )}
              </div>

              {/* Medical History */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg mb-4 flex items-center gap-2">
                  <FileText className="size-5 text-blue-600" />
                  Medical History
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Blood Group</p>
                    <p>{patient.bloodGroup || 'Not recorded'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Insurance</p>
                    <p>{patient.insuranceProvider || 'No insurance'}</p>
                    {patient.insuranceNumber && (
                      <p className="text-sm text-gray-600">Policy: {patient.insuranceNumber}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Emergency Contact</p>
                    <p>{patient.nextOfKin || 'Not provided'} {patient.nextOfKinPhone ? `- ${patient.nextOfKinPhone}` : ''}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg mb-4">Quick Actions</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button 
                    onClick={() => setShowLabOrderModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <FlaskConical className="size-4" />
                    Order Lab Test
                  </button>
                  <button 
                    onClick={() => setShowPrescriptionModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Pill className="size-4" />
                    Write Prescription
                  </button>
                  <button 
                    onClick={() => setShowConsultationModal(true)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <CalendarPlus className="size-4" />
                    Schedule Follow-up
                  </button>
                  <button 
                    onClick={() => setShowUploadModal(true)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Upload className="size-4" />
                    Upload Report
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <User className="size-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select a patient to view their records</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Report Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg">Upload Medical Report</h3>
              <button onClick={() => setShowUploadModal(false)}>
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Report Type</label>
                <select name="reportType" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Lab Report">Lab Report</option>
                  <option value="Imaging">Imaging</option>
                  <option value="Consultation Note">Consultation Note</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">File</label>
                <input type="file" name="file" required accept=".pdf,.jpg,.jpeg,.png" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Description (Optional)</label>
                <textarea name="description" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={uploading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Consultation Modal */}
      {showConsultationModal && patient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg">Schedule Consultation</h3>
              <button onClick={() => setShowConsultationModal(false)}>
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreateConsultation} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Department</label>
                <select name="department" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="General">General</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Orthopedics">Orthopedics</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Date</label>
                <input type="date" name="appointmentDate" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Time</label>
                <input type="time" name="appointmentTime" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Notes (Optional)</label>
                <textarea name="notes" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowConsultationModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lab Order Modal */}
      {showLabOrderModal && patient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg">Order Lab Test</h3>
              <button onClick={() => setShowLabOrderModal(false)}>
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLabOrder} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Test Type</label>
                <select name="testType" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Blood Test">Blood Test</option>
                  <option value="Urine Test">Urine Test</option>
                  <option value="X-Ray">X-Ray</option>
                  <option value="CT Scan">CT Scan</option>
                  <option value="MRI">MRI</option>
                  <option value="Ultrasound">Ultrasound</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Test Name</label>
                <input type="text" name="testName" required placeholder="e.g., Complete Blood Count" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Priority</label>
                <select name="priority" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="STAT">STAT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Notes (Optional)</label>
                <textarea name="notes" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowLabOrderModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      {showPrescriptionModal && patient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg">Write Prescription</h3>
              <button onClick={() => setShowPrescriptionModal(false)}>
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePrescription} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Medication</label>
                <input type="text" name="medication" required placeholder="e.g., Amoxicillin" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Dosage</label>
                <input type="text" name="dosage" required placeholder="e.g., 500mg" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Frequency</label>
                <select name="frequency" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                  <option value="Every 4 hours">Every 4 hours</option>
                  <option value="Every 6 hours">Every 6 hours</option>
                  <option value="As needed">As needed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Duration</label>
                <input type="text" name="duration" required placeholder="e.g., 7 days" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Instructions (Optional)</label>
                <textarea name="notes" rows={3} placeholder="e.g., Take with food" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowPrescriptionModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Create Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
        <Icon className="size-4" />
        <span>{label}</span>
      </div>
      <p className="text-sm">{value}</p>
    </div>
  );
}

function VitalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-xl">{value}</p>
    </div>
  );
}
