# OPAL HMS - Troubleshooting Guide

## Common Issues and Solutions

### 1. "Invalid Credentials" Error on Login

**Cause:** The default admin account hasn't been created yet.

**Solution:**
1. Click the **"First Time Setup?"** button on the login page
2. Click **"Initialize System"**
3. Wait for the success message showing the admin credentials
4. The login form will auto-fill with the credentials
5. Click **"Sign In"**

**Default Credentials:**
- Email: `admin@opalhospital.com`
- Password: `OpalAdmin2025!`

---

### 2. Setup Button Shows "Admin Already Exists"

**Cause:** The admin account was already created in a previous setup.

**Solution:**
Simply use the default credentials to log in:
- Email: `admin@opalhospital.com`
- Password: `OpalAdmin2025!`

If you forgot the password, you'll need to check your Supabase dashboard or reset it.

---

### 3. Cannot Create Staff Accounts

**Cause:** You're not logged in as an administrator.

**Solution:**
1. Make sure you're logged in with an admin account
2. Only users with the "admin" role can create staff accounts
3. Navigate to **Staff Management** from the admin dashboard
4. Click **"Add Staff"** to create new staff accounts

---

### 4. Patient Registration Fails

**Cause:** You're not logged in as a registrar or admin.

**Solution:**
1. Create a registrar account first (as admin):
   - Go to Staff Management
   - Add new staff with role: "Registrar"
2. Log out and log in as the registrar
3. Now you can register patients

---

### 5. Session Expires or Logged Out Unexpectedly

**Solution:**
The session is stored in localStorage. If you clear your browser data, you'll need to log in again.

---

### 6. Server/API Errors

**Symptoms:**
- Errors like "Failed to fetch"
- Network errors
- 500 Internal Server Error

**Solution:**
1. Check your Supabase Edge Function logs
2. Ensure environment variables are set:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Check the Edge Function is deployed and running

---

### 7. Data Not Persisting

**Cause:** KV store connectivity issue

**Solution:**
1. Check Supabase dashboard for KV store data
2. Verify the database connection is active
3. Check Edge Function logs for any KV store errors

---

### 8. Staff List Shows Empty

**Cause:** No staff members have been created yet, or there's a fetch error.

**Solution:**
1. Create at least one staff member first
2. Check browser console for any error messages
3. Verify you're logged in as admin
4. Check network tab for failed API calls

---

## System Architecture

### Authentication Flow
```
1. User enters credentials → Frontend
2. Frontend calls /auth/signin → Backend API
3. Backend validates with Supabase Auth
4. Returns JWT token + user metadata
5. Frontend stores session in localStorage
6. User redirected to role-specific dashboard
```

### Role Hierarchy
```
Admin → Can create all staff accounts
  ├─ Registrar → Can register patients
  ├─ Doctor → Can view/treat patients
  ├─ Nurse → Can record vitals
  ├─ Lab Tech → Can process lab tests
  └─ Pharmacist → Can dispense medications

Patient → Created by Registrar
```

---

## Debugging Tips

### Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for red error messages
4. Copy the full error and check what failed

### Check Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Click on failed requests
5. Check the Response tab for error details

### Check Supabase Logs
1. Go to your Supabase Dashboard
2. Navigate to Edge Functions
3. Select the "server" function
4. Click "Logs" to see server-side errors

### Clear Cache & Data
If strange behavior persists:
1. Clear browser cache
2. Clear localStorage: `localStorage.clear()` in console
3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

---

## Getting Help

### Information to Provide
When reporting issues, include:
1. What action you were trying to perform
2. Error message (exact text)
3. Browser console logs
4. Network request/response details
5. Your user role

### Quick Health Check
Test if the API is running:
```bash
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-a210bd47/health
```

Should return: `{"status":"ok","timestamp":"..."}`

---

## Security Notes

⚠️ **Important:**
- Change the default admin password immediately after first login
- Never share service role keys
- Use strong passwords for all staff accounts
- Patients should change their temporary passwords

---

## Reset Instructions

### Complete System Reset
To start fresh (⚠️ DELETES ALL DATA):
1. Go to Supabase Dashboard
2. Navigate to Database → Tables
3. Delete all records from `kv_store_a210bd47`
4. Run setup again to recreate admin

### Reset Admin Password
Currently requires manual intervention via Supabase Dashboard:
1. Go to Authentication → Users
2. Find admin@opalhospital.com
3. Use "Reset password" option
