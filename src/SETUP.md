# OPAL Hospital Management System - Setup Guide

## Overview

OPAL HMS is a comprehensive Hospital Management System with role-based access control, connected to Supabase for authentication and data persistence.

## Features

✅ **Role-Based Access Control**
- Administrator
- Doctor
- Nurse
- Lab Technician
- Pharmacist
- Patient Registrar
- Patient Portal

✅ **Admin Functions**
- Create staff accounts for all roles
- Manage hospital staff
- View system analytics
- Configure system settings

✅ **Registrar Functions**
- Register new patients
- Automatically create patient portal accounts
- Manage appointments
- Issue patient credentials

✅ **Full Clinical Workflow**
- Patient registration & records
- Appointment scheduling
- Vital signs recording
- Lab test orders & results
- E-prescriptions & pharmacy dispensing
- Drug inventory management

## Initial Setup

### Step 1: Create Default Admin Account

After deployment, you need to create the default administrator account:

**Method 1: Using the setup endpoint**

Make a POST request to initialize the system:

```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-a210bd47/setup/init \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Method 2: Check the server logs**

The setup function creates the admin account automatically. Check your Supabase Edge Function logs for the credentials.

### Default Admin Credentials

```
Email: admin@opalhospital.com
Password: OpalAdmin2025!
```

⚠️ **IMPORTANT:** Change this password immediately after first login!

### Step 2: Login as Administrator

1. Navigate to your deployed application
2. Sign in using the default admin credentials
3. You'll be redirected to the Administrator Dashboard

### Step 3: Create Staff Accounts

As an administrator, you can create accounts for all hospital staff:

1. Go to **Staff Management** in the admin dashboard
2. Click **Add Staff** button
3. Fill in the staff member's information:
   - Name and contact details
   - Email (will be their username)
   - Password
   - Role (Doctor, Nurse, Lab Tech, Pharmacist, Registrar)
   - Department

4. Click **Add Staff Member**

The staff member can now login with their email and password.

### Step 4: Create a Registrar Account

1. From Admin Dashboard → Staff Management
2. Add a new staff member with role: **Registrar**
3. Assign to department: **Front Desk**

### Step 5: Register Patients (as Registrar)

1. Sign out and login as the Registrar
2. Go to **Register Patient**
3. Fill in patient information
4. Click **Register Patient & Create Account**

The system will:
- Generate a unique MRN (Medical Record Number)
- Create a patient portal account
- Display temporary login credentials for the patient

⚠️ **Give these credentials to the patient** so they can access the patient portal!

## User Roles & Permissions

### Administrator
- ✅ Create and manage all staff accounts
- ✅ View all system data
- ✅ Access analytics and reports
- ✅ Configure system settings
- ✅ Manage departments

### Registrar
- ✅ Register new patients (automatically creates portal accounts)
- ✅ Book and manage appointments
- ✅ Update patient demographics
- ✅ Print patient cards

### Doctor
- ✅ View appointments and patient records
- ✅ Record diagnoses and treatment plans
- ✅ Order laboratory tests
- ✅ Write prescriptions
- ✅ Schedule follow-ups

### Nurse
- ✅ Record vital signs
- ✅ Update nursing notes
- ✅ View assigned patients
- ✅ Manage bed assignments

### Lab Technician
- ✅ View lab test orders
- ✅ Update test status
- ✅ Upload test results

### Pharmacist
- ✅ View prescriptions
- ✅ Dispense medications
- ✅ Manage drug inventory
- ✅ Track stock levels

### Patient (Portal)
- ✅ View appointments
- ✅ Access medical records
- ✅ Download lab results
- ✅ View prescriptions
- ✅ Request medication refills

## Data Structure

All data is stored in Supabase:
- **Authentication:** Supabase Auth with user metadata for roles
- **Patient Records:** KV Store with prefix `patient:`
- **Staff Records:** KV Store with prefix `staff:`
- **Appointments:** KV Store with prefix `appointment:`

## Security Features

✅ Role-based access control (RBAC)
✅ Encrypted authentication via Supabase
✅ Session management with JWT tokens
✅ Admin-only staff creation
✅ Registrar-only patient creation
✅ Automatic credential generation for patients

## Important Notes

1. **First Time Setup:** Run the setup endpoint once to create the default admin
2. **Password Security:** Always use strong passwords for staff accounts
3. **Patient Credentials:** The registrar must provide patients with their login credentials
4. **Email Configuration:** Patient emails can be auto-generated if not provided
5. **Data Persistence:** All data is stored in Supabase KV store

## Troubleshooting

### Cannot login as admin
- Ensure you've run the setup endpoint
- Check server logs for the created credentials
- Verify Supabase environment variables are set

### Staff account creation fails
- Ensure you're logged in as Administrator
- Check that all required fields are filled
- Verify password meets minimum requirements (6 characters)

### Patient registration fails
- Ensure you're logged in as Registrar or Admin
- Check that all required fields are filled
- Verify phone number format

## Next Steps

After setup, you can:
1. Create doctor accounts and assign to departments
2. Register patients through the registrar
3. Book appointments
4. Record vital signs through nurses
5. Order lab tests and prescriptions
6. Manage the complete clinical workflow

## Support

For issues or questions, check the server logs in your Supabase dashboard under Edge Functions.
