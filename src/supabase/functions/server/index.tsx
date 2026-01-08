import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import { createDefaultAdmin } from './setup.tsx';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Initialize Supabase client
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
};

// Initialize storage bucket for medical reports
const initializeStorageBucket = async () => {
  const supabase = getSupabaseClient();
  const bucketName = 'make-a210bd47-medical-reports';
  
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 10485760 // 10MB
      });
      console.log('Medical reports bucket created successfully');
    }
  } catch (error) {
    console.error('Error initializing storage bucket:', error);
  }
};

// Initialize bucket on startup
initializeStorageBucket();

// Helper to send email via Resend
const sendEmail = async (to: string, subject: string, html: string) => {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'OPAL HMS <noreply@opalhospital.com>',
        to,
        subject,
        html
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Resend API error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send email' };
  }
};

// Helper to verify admin role
const verifyAdmin = async (accessToken: string) => {
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
    return null;
  }
  
  // Get user role from user_metadata
  if (user.user_metadata?.role !== 'admin') {
    return null;
  }
  
  return user;
};

// Helper to verify authenticated user
const verifyUser = async (accessToken: string) => {
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
    return null;
  }
  
  return user;
};

// ================== Authentication Routes ==================

// Admin creates staff account
app.post('/make-server-a210bd47/auth/create-staff', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    // Verify admin role
    const admin = await verifyAdmin(accessToken);
    if (!admin) {
      return c.json({ error: 'Unauthorized: Admin access required' }, 403);
    }
    
    const body = await c.req.json();
    const { email, password, firstName, lastName, role, department, phone } = body;
    
    if (!email || !password || !firstName || !lastName || !role) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // Validate role
    const validRoles = ['doctor', 'nurse', 'lab_tech', 'pharmacist', 'registrar', 'admin'];
    if (!validRoles.includes(role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }
    
    const supabase = getSupabaseClient();
    
    // Create user account
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since we don't have email server configured
      user_metadata: {
        firstName,
        lastName,
        role,
        department,
        phone,
        name: `${firstName} ${lastName}`
      }
    });
    
    if (error) {
      console.log('Error creating staff account:', error);
      return c.json({ error: `Failed to create staff account: ${error.message}` }, 400);
    }
    
    // Store additional staff info in KV store
    await kv.set(`staff:${data.user.id}`, {
      id: data.user.id,
      email,
      firstName,
      lastName,
      role,
      department,
      phone,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: admin.id
    });
    
    return c.json({ 
      success: true, 
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
        name: `${firstName} ${lastName}`
      }
    });
    
  } catch (error) {
    console.error('Error in create-staff endpoint:', error);
    return c.json({ error: 'Internal server error while creating staff account' }, 500);
  }
});

// Patient registrar creates patient account
app.post('/make-server-a210bd47/auth/create-patient', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    // Verify user is authenticated (registrar or admin)
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    // Check if user is registrar or admin
    const userRole = user.user_metadata?.role;
    if (userRole !== 'registrar' && userRole !== 'admin') {
      return c.json({ error: 'Unauthorized: Only registrars can create patient accounts' }, 403);
    }
    
    const body = await c.req.json();
    const { patientData } = body;
    
    if (!patientData || !patientData.firstName || !patientData.lastName || !patientData.phone) {
      return c.json({ error: 'Missing required patient information' }, 400);
    }
    
    // Generate MRN
    const mrn = `MRN${new Date().getFullYear()}${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
    
    // Generate email if not provided (using MRN)
    const email = patientData.email || `${mrn.toLowerCase()}@patient.opalhospital.com`;
    
    // Generate random password (patient can reset later)
    const password = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    
    const supabase = getSupabaseClient();
    
    // Create patient account
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        role: 'patient',
        name: `${patientData.firstName} ${patientData.lastName}`,
        mrn
      }
    });
    
    if (error) {
      console.log('Error creating patient account:', error);
      return c.json({ error: `Failed to create patient account: ${error.message}` }, 400);
    }
    
    // Store patient info in KV store
    const patientRecord = {
      id: data.user.id,
      mrn,
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      dateOfBirth: patientData.dateOfBirth,
      gender: patientData.gender,
      phone: patientData.phone,
      email,
      address: patientData.address,
      nextOfKin: patientData.nextOfKin,
      nextOfKinPhone: patientData.nextOfKinPhone,
      insuranceProvider: patientData.insuranceProvider,
      insuranceNumber: patientData.insuranceNumber,
      bloodGroup: patientData.bloodGroup,
      allergies: patientData.allergies ? patientData.allergies.split(',').map((a: string) => a.trim()) : [],
      chronicConditions: patientData.chronicConditions ? patientData.chronicConditions.split(',').map((c: string) => c.trim()) : [],
      registrationDate: new Date().toISOString(),
      registeredBy: user.id,
      status: 'active'
    };
    
    await kv.set(`patient:${data.user.id}`, patientRecord);
    await kv.set(`patient:mrn:${mrn}`, data.user.id);
    
    return c.json({ 
      success: true, 
      patient: {
        id: data.user.id,
        mrn,
        email,
        temporaryPassword: password,
        name: `${patientData.firstName} ${patientData.lastName}`
      }
    });
    
  } catch (error) {
    console.error('Error in create-patient endpoint:', error);
    return c.json({ error: 'Internal server error while creating patient account' }, 500);
  }
});

// Sign in endpoint
app.post('/make-server-a210bd47/auth/signin', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.log('Sign in error:', error);
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Get additional user info based on role
    const role = data.user.user_metadata?.role;
    let additionalData = null;
    
    if (role === 'patient') {
      additionalData = await kv.get(`patient:${data.user.id}`);
    } else {
      additionalData = await kv.get(`staff:${data.user.id}`);
    }
    
    return c.json({ 
      success: true,
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
        name: data.user.user_metadata?.name,
        department: data.user.user_metadata?.department,
        additionalData
      }
    });
    
  } catch (error) {
    console.error('Error in signin endpoint:', error);
    return c.json({ error: 'Internal server error during sign in' }, 500);
  }
});

// ================== Staff Management Routes ==================

// Get all staff (admin only)
app.get('/make-server-a210bd47/staff', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const admin = await verifyAdmin(accessToken);
    if (!admin) {
      return c.json({ error: 'Unauthorized: Admin access required' }, 403);
    }
    
    // Get all staff from KV store
    const staffList = await kv.getByPrefix('staff:');
    
    return c.json({ success: true, staff: staffList });
    
  } catch (error) {
    console.error('Error fetching staff:', error);
    return c.json({ error: 'Internal server error while fetching staff' }, 500);
  }
});

// Update staff status (admin only)
app.patch('/make-server-a210bd47/staff/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const admin = await verifyAdmin(accessToken);
    if (!admin) {
      return c.json({ error: 'Unauthorized: Admin access required' }, 403);
    }
    
    const staffId = c.req.param('id');
    const body = await c.req.json();
    
    const staffData = await kv.get(`staff:${staffId}`);
    if (!staffData) {
      return c.json({ error: 'Staff member not found' }, 404);
    }
    
    // Update staff data
    const updatedStaff = { ...staffData, ...body, updatedAt: new Date().toISOString() };
    await kv.set(`staff:${staffId}`, updatedStaff);
    
    return c.json({ success: true, staff: updatedStaff });
    
  } catch (error) {
    console.error('Error updating staff:', error);
    return c.json({ error: 'Internal server error while updating staff' }, 500);
  }
});

// ================== Patient Management Routes ==================

// Get all patients
app.get('/make-server-a210bd47/patients', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const patients = await kv.getByPrefix('patient:');
    // Filter out the mrn mapping entries
    const patientRecords = patients.filter((p: any) => !p.id?.startsWith('patient:mrn:'));
    
    return c.json({ success: true, patients: patientRecords });
    
  } catch (error) {
    console.error('Error fetching patients:', error);
    return c.json({ error: 'Internal server error while fetching patients' }, 500);
  }
});

// Get patient by ID
app.get('/make-server-a210bd47/patients/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const patientId = c.req.param('id');
    const patient = await kv.get(`patient:${patientId}`);
    
    if (!patient) {
      return c.json({ error: 'Patient not found' }, 404);
    }
    
    return c.json({ success: true, patient });
    
  } catch (error) {
    console.error('Error fetching patient:', error);
    return c.json({ error: 'Internal server error while fetching patient' }, 500);
  }
});

// ================== Appointments Routes ==================

// Create appointment
app.post('/make-server-a210bd47/appointments', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const body = await c.req.json();
    const appointmentId = `APT${Date.now()}`;
    
    const appointment = {
      id: appointmentId,
      ...body,
      createdAt: new Date().toISOString(),
      createdBy: user.id
    };
    
    await kv.set(`appointment:${appointmentId}`, appointment);
    
    return c.json({ success: true, appointment });
    
  } catch (error) {
    console.error('Error creating appointment:', error);
    return c.json({ error: 'Internal server error while creating appointment' }, 500);
  }
});

// Get appointments
app.get('/make-server-a210bd47/appointments', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const appointments = await kv.getByPrefix('appointment:');
    
    return c.json({ success: true, appointments });
    
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return c.json({ error: 'Internal server error while fetching appointments' }, 500);
  }
});

// ================== Vitals Routes ==================

// Create vital signs record
app.post('/make-server-a210bd47/vitals', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const body = await c.req.json();
    const vitalId = `VIT${Date.now()}`;
    
    const vital = {
      id: vitalId,
      ...body,
      recordedAt: new Date().toISOString(),
      recordedBy: user.id,
      recordedByName: user.user_metadata?.name
    };
    
    await kv.set(`vital:${vitalId}`, vital);
    
    // Also store by patient for easy lookup
    await kv.set(`vital:patient:${body.patientId}:${vitalId}`, vital);
    
    return c.json({ success: true, vital });
    
  } catch (error) {
    console.error('Error creating vital record:', error);
    return c.json({ error: 'Internal server error while creating vital record' }, 500);
  }
});

// Get vitals for a patient
app.get('/make-server-a210bd47/vitals/patient/:patientId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const patientId = c.req.param('patientId');
    const vitals = await kv.getByPrefix(`vital:patient:${patientId}:`);
    
    return c.json({ success: true, vitals });
    
  } catch (error) {
    console.error('Error fetching vitals:', error);
    return c.json({ error: 'Internal server error while fetching vitals' }, 500);
  }
});

// ================== Lab Orders Routes ==================

// Create lab order
app.post('/make-server-a210bd47/lab-orders', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const body = await c.req.json();
    const orderId = `LAB${Date.now()}`;
    
    const labOrder = {
      id: orderId,
      ...body,
      orderedAt: new Date().toISOString(),
      orderedBy: user.id,
      orderedByName: user.user_metadata?.name,
      status: body.status || 'Pending'
    };
    
    await kv.set(`lab:${orderId}`, labOrder);
    
    return c.json({ success: true, labOrder });
    
  } catch (error) {
    console.error('Error creating lab order:', error);
    return c.json({ error: 'Internal server error while creating lab order' }, 500);
  }
});

// Get all lab orders
app.get('/make-server-a210bd47/lab-orders', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const labOrders = await kv.getByPrefix('lab:');
    
    return c.json({ success: true, labOrders });
    
  } catch (error) {
    console.error('Error fetching lab orders:', error);
    return c.json({ error: 'Internal server error while fetching lab orders' }, 500);
  }
});

// Update lab order status
app.patch('/make-server-a210bd47/lab-orders/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const orderId = c.req.param('id');
    const body = await c.req.json();
    
    const labOrder = await kv.get(`lab:${orderId}`);
    if (!labOrder) {
      return c.json({ error: 'Lab order not found' }, 404);
    }
    
    const updatedOrder = {
      ...labOrder,
      ...body,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id
    };
    
    await kv.set(`lab:${orderId}`, updatedOrder);
    
    return c.json({ success: true, labOrder: updatedOrder });
    
  } catch (error) {
    console.error('Error updating lab order:', error);
    return c.json({ error: 'Internal server error while updating lab order' }, 500);
  }
});

// ================== Prescriptions Routes ==================

// Create prescription
app.post('/make-server-a210bd47/prescriptions', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const body = await c.req.json();
    const prescriptionId = `RX${Date.now()}`;
    
    const prescription = {
      id: prescriptionId,
      ...body,
      prescribedAt: new Date().toISOString(),
      prescribedBy: user.id,
      prescribedByName: user.user_metadata?.name,
      status: body.status || 'Active'
    };
    
    await kv.set(`prescription:${prescriptionId}`, prescription);
    
    return c.json({ success: true, prescription });
    
  } catch (error) {
    console.error('Error creating prescription:', error);
    return c.json({ error: 'Internal server error while creating prescription' }, 500);
  }
});

// Get all prescriptions
app.get('/make-server-a210bd47/prescriptions', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const prescriptions = await kv.getByPrefix('prescription:');
    
    return c.json({ success: true, prescriptions });
    
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return c.json({ error: 'Internal server error while fetching prescriptions' }, 500);
  }
});

// Update prescription (dispense)
app.patch('/make-server-a210bd47/prescriptions/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const prescriptionId = c.req.param('id');
    const body = await c.req.json();
    
    const prescription = await kv.get(`prescription:${prescriptionId}`);
    if (!prescription) {
      return c.json({ error: 'Prescription not found' }, 404);
    }
    
    const updatedPrescription = {
      ...prescription,
      ...body,
      updatedAt: new Date().toISOString(),
      dispensedBy: user.id,
      dispensedByName: user.user_metadata?.name
    };
    
    await kv.set(`prescription:${prescriptionId}`, updatedPrescription);
    
    return c.json({ success: true, prescription: updatedPrescription });
    
  } catch (error) {
    console.error('Error updating prescription:', error);
    return c.json({ error: 'Internal server error while updating prescription' }, 500);
  }
});

// ================== Consultations Routes ==================

// Create consultation
app.post('/make-server-a210bd47/consultations', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const body = await c.req.json();
    const consultationId = `CONS${Date.now()}`;
    
    const consultation = {
      id: consultationId,
      ...body,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      createdByName: user.user_metadata?.name,
      status: body.status || 'scheduled'
    };
    
    await kv.set(`consultation:${consultationId}`, consultation);
    await kv.set(`consultation:patient:${body.patientId}:${consultationId}`, consultation);
    
    // Send appointment confirmation email
    if (body.patientEmail) {
      const emailHtml = `
        <h2>Consultation Scheduled - OPAL HMS</h2>
        <p>Dear ${body.patientName},</p>
        <p>Your consultation has been scheduled:</p>
        <ul>
          <li><strong>Doctor:</strong> ${body.doctorName}</li>
          <li><strong>Date:</strong> ${new Date(body.appointmentDate).toLocaleDateString()}</li>
          <li><strong>Time:</strong> ${body.appointmentTime}</li>
          <li><strong>Department:</strong> ${body.department || 'General'}</li>
        </ul>
        <p>Please arrive 15 minutes before your scheduled time.</p>
        <p>If you need to reschedule, please contact us at least 24 hours in advance.</p>
        <br>
        <p>Best regards,<br>OPAL Hospital Management System</p>
      `;
      
      await sendEmail(body.patientEmail, 'Consultation Scheduled', emailHtml);
    }
    
    return c.json({ success: true, consultation });
    
  } catch (error) {
    console.error('Error creating consultation:', error);
    return c.json({ error: 'Internal server error while creating consultation' }, 500);
  }
});

// Get all consultations
app.get('/make-server-a210bd47/consultations', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const consultations = await kv.getByPrefix('consultation:');
    // Filter out patient-specific mappings
    const consultationRecords = consultations.filter((c: any) => 
      c.id && c.id.startsWith('CONS')
    );
    
    return c.json({ success: true, consultations: consultationRecords });
    
  } catch (error) {
    console.error('Error fetching consultations:', error);
    return c.json({ error: 'Internal server error while fetching consultations' }, 500);
  }
});

// Get consultations for a patient
app.get('/make-server-a210bd47/consultations/patient/:patientId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const patientId = c.req.param('patientId');
    const consultations = await kv.getByPrefix(`consultation:patient:${patientId}:`);
    
    return c.json({ success: true, consultations });
    
  } catch (error) {
    console.error('Error fetching patient consultations:', error);
    return c.json({ error: 'Internal server error while fetching patient consultations' }, 500);
  }
});

// Update consultation
app.patch('/make-server-a210bd47/consultations/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const consultationId = c.req.param('id');
    const body = await c.req.json();
    
    const consultation = await kv.get(`consultation:${consultationId}`);
    if (!consultation) {
      return c.json({ error: 'Consultation not found' }, 404);
    }
    
    const updatedConsultation = {
      ...consultation,
      ...body,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id
    };
    
    await kv.set(`consultation:${consultationId}`, updatedConsultation);
    await kv.set(`consultation:patient:${consultation.patientId}:${consultationId}`, updatedConsultation);
    
    return c.json({ success: true, consultation: updatedConsultation });
    
  } catch (error) {
    console.error('Error updating consultation:', error);
    return c.json({ error: 'Internal server error while updating consultation' }, 500);
  }
});

// ================== Medical Reports Routes ==================

// Upload medical report
app.post('/make-server-a210bd47/medical-reports/upload', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    // Check if user has permission to upload medical reports
    const userRole = user.user_metadata?.role;
    if (!['doctor', 'nurse', 'lab_tech', 'admin'].includes(userRole)) {
      return c.json({ error: 'Unauthorized: Insufficient permissions' }, 403);
    }
    
    const body = await c.req.json();
    const { patientId, fileName, fileData, fileType, reportType, description } = body;
    
    if (!patientId || !fileName || !fileData) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const supabase = getSupabaseClient();
    const reportId = `RPT${Date.now()}`;
    const filePath = `${patientId}/${reportId}_${fileName}`;
    
    // Convert base64 to buffer
    const base64Data = fileData.split(',')[1] || fileData;
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('make-a210bd47-medical-reports')
      .upload(filePath, buffer, {
        contentType: fileType || 'application/pdf',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading file to storage:', uploadError);
      return c.json({ error: `Failed to upload file: ${uploadError.message}` }, 400);
    }
    
    // Create signed URL (valid for 1 year)
    const { data: urlData } = await supabase.storage
      .from('make-a210bd47-medical-reports')
      .createSignedUrl(filePath, 31536000); // 1 year in seconds
    
    // Store report metadata in KV
    const report = {
      id: reportId,
      patientId,
      fileName,
      filePath,
      fileType: fileType || 'application/pdf',
      reportType: reportType || 'General',
      description,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.id,
      uploadedByName: user.user_metadata?.name,
      signedUrl: urlData?.signedUrl
    };
    
    await kv.set(`medical-report:${reportId}`, report);
    await kv.set(`medical-report:patient:${patientId}:${reportId}`, report);
    
    return c.json({ success: true, report });
    
  } catch (error) {
    console.error('Error uploading medical report:', error);
    return c.json({ error: 'Internal server error while uploading medical report' }, 500);
  }
});

// Get medical reports for a patient
app.get('/make-server-a210bd47/medical-reports/patient/:patientId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const patientId = c.req.param('patientId');
    
    // Check authorization
    const userRole = user.user_metadata?.role;
    if (userRole === 'patient' && user.id !== patientId) {
      return c.json({ error: 'Unauthorized: Cannot access other patients\' records' }, 403);
    }
    
    const reports = await kv.getByPrefix(`medical-report:patient:${patientId}:`);
    
    // Refresh signed URLs if needed (check if older than 6 months)
    const supabase = getSupabaseClient();
    const refreshedReports = await Promise.all(
      reports.map(async (report: any) => {
        const uploadedDate = new Date(report.uploadedAt);
        const monthsOld = (Date.now() - uploadedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        
        if (monthsOld > 6) {
          const { data: urlData } = await supabase.storage
            .from('make-a210bd47-medical-reports')
            .createSignedUrl(report.filePath, 31536000);
          
          if (urlData?.signedUrl) {
            report.signedUrl = urlData.signedUrl;
            await kv.set(`medical-report:${report.id}`, report);
            await kv.set(`medical-report:patient:${patientId}:${report.id}`, report);
          }
        }
        
        return report;
      })
    );
    
    return c.json({ success: true, reports: refreshedReports });
    
  } catch (error) {
    console.error('Error fetching medical reports:', error);
    return c.json({ error: 'Internal server error while fetching medical reports' }, 500);
  }
});

// Delete medical report
app.delete('/make-server-a210bd47/medical-reports/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    // Check if user has permission to delete medical reports
    const userRole = user.user_metadata?.role;
    if (!['doctor', 'admin'].includes(userRole)) {
      return c.json({ error: 'Unauthorized: Insufficient permissions' }, 403);
    }
    
    const reportId = c.req.param('id');
    const report = await kv.get(`medical-report:${reportId}`);
    
    if (!report) {
      return c.json({ error: 'Medical report not found' }, 404);
    }
    
    const supabase = getSupabaseClient();
    
    // Delete from storage
    await supabase.storage
      .from('make-a210bd47-medical-reports')
      .remove([report.filePath]);
    
    // Delete from KV
    await kv.del(`medical-report:${reportId}`);
    await kv.del(`medical-report:patient:${report.patientId}:${reportId}`);
    
    return c.json({ success: true, message: 'Medical report deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting medical report:', error);
    return c.json({ error: 'Internal server error while deleting medical report' }, 500);
  }
});

// ================== Reminders & Notifications Routes ==================

// Send appointment reminder
app.post('/make-server-a210bd47/reminders/appointment', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const body = await c.req.json();
    const { patientEmail, patientName, doctorName, appointmentDate, appointmentTime } = body;
    
    if (!patientEmail) {
      return c.json({ error: 'Patient email required' }, 400);
    }
    
    const emailHtml = `
      <h2>Appointment Reminder - OPAL HMS</h2>
      <p>Dear ${patientName},</p>
      <p>This is a reminder about your upcoming appointment:</p>
      <ul>
        <li><strong>Doctor:</strong> ${doctorName}</li>
        <li><strong>Date:</strong> ${new Date(appointmentDate).toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${appointmentTime}</li>
      </ul>
      <p>Please arrive 15 minutes before your scheduled time.</p>
      <p>If you need to reschedule, please contact us as soon as possible.</p>
      <br>
      <p>Best regards,<br>OPAL Hospital Management System</p>
    `;
    
    const result = await sendEmail(patientEmail, 'Appointment Reminder', emailHtml);
    
    if (result.success) {
      return c.json({ success: true, message: 'Reminder sent successfully' });
    } else {
      return c.json({ success: false, error: result.error }, 400);
    }
    
  } catch (error) {
    console.error('Error sending reminder:', error);
    return c.json({ error: 'Internal server error while sending reminder' }, 500);
  }
});

// Send prescription notification
app.post('/make-server-a210bd47/notifications/prescription', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }
    
    const user = await verifyUser(accessToken);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const body = await c.req.json();
    const { patientEmail, patientName, medications } = body;
    
    if (!patientEmail) {
      return c.json({ error: 'Patient email required' }, 400);
    }
    
    const medicationsList = medications?.map((med: any) => 
      `<li><strong>${med.name}</strong> - ${med.dosage} (${med.frequency})</li>`
    ).join('') || '';
    
    const emailHtml = `
      <h2>New Prescription - OPAL HMS</h2>
      <p>Dear ${patientName},</p>
      <p>A new prescription has been issued for you:</p>
      <ul>
        ${medicationsList}
      </ul>
      <p>Please visit the pharmacy to collect your medications.</p>
      <p>Remember to follow the dosage instructions carefully.</p>
      <br>
      <p>Best regards,<br>OPAL Hospital Management System</p>
    `;
    
    const result = await sendEmail(patientEmail, 'New Prescription Available', emailHtml);
    
    if (result.success) {
      return c.json({ success: true, message: 'Notification sent successfully' });
    } else {
      return c.json({ success: false, error: result.error }, 400);
    }
    
  } catch (error) {
    console.error('Error sending notification:', error);
    return c.json({ error: 'Internal server error while sending notification' }, 500);
  }
});

// Health check
app.get('/make-server-a210bd47/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup endpoint - creates default admin (can only be run once)
app.post('/make-server-a210bd47/setup/init', async (c) => {
  try {
    const result = await createDefaultAdmin();
    return c.json(result);
  } catch (error) {
    console.error('Setup error:', error);
    return c.json({ error: 'Setup failed' }, 500);
  }
});

Deno.serve(app.fetch);