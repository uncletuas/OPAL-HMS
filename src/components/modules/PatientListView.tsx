import { Users, Search, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function PatientListView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      } else {
        setError('Failed to load patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('Failed to load patients');
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
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
          <h3 className="text-xl mb-1">Patient Records</h3>
          <p className="text-gray-600">{patients.length} patient{patients.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button
          onClick={fetchPatients}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search patients by name or MRN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="size-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {patients.length === 0 ? 'No patients registered yet' : 'No patients found matching your search'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPatients.map((patient) => (
            <div key={patient.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-lg">
                  {patient.firstName?.charAt(0) || 'P'}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-lg mb-1">{patient.firstName} {patient.lastName}</h4>
                      <p className="text-sm text-gray-600">
                        {patient.mrn} • {patient.gender} • DOB: {formatDate(patient.dateOfBirth)}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {patient.status || 'Active'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Blood Group</p>
                      <p>{patient.bloodGroup || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Phone</p>
                      <p>{patient.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="truncate">{patient.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Registered</p>
                      <p>{formatDate(patient.registrationDate)}</p>
                    </div>
                  </div>
                  {(patient.allergies?.length > 0 || patient.chronicConditions?.length > 0) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {patient.allergies?.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm text-red-600">Allergies: </span>
                          <span className="text-sm">{patient.allergies.join(', ')}</span>
                        </div>
                      )}
                      {patient.chronicConditions?.length > 0 && (
                        <div>
                          <span className="text-sm text-amber-600">Chronic Conditions: </span>
                          <span className="text-sm">{patient.chronicConditions.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}