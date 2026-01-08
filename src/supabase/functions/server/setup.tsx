/**
 * Setup Script: Creates the default administrator account
 * 
 * This script should be run once after deployment to create the initial admin user.
 * 
 * Default Admin Credentials:
 * Email: admin@opalhospital.com
 * Password: OpalAdmin2025!
 * 
 * IMPORTANT: Change this password immediately after first login!
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

export async function createDefaultAdmin() {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const defaultAdminEmail = 'admin@opalhospital.com';
  const defaultAdminPassword = 'OpalAdmin2025!';

  try {
    // Check if admin already exists
    const existingAdmin = await kv.get('setup:admin_created');
    if (existingAdmin) {
      console.log('Default admin account already exists');
      return { success: true, message: 'Admin already exists' };
    }

    // Create admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: defaultAdminEmail,
      password: defaultAdminPassword,
      email_confirm: true,
      user_metadata: {
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        department: 'Administration',
        name: 'System Administrator'
      }
    });

    if (error) {
      console.error('Error creating default admin:', error);
      return { success: false, error: error.message };
    }

    // Store admin info in KV store
    await kv.set(`staff:${data.user.id}`, {
      id: data.user.id,
      email: defaultAdminEmail,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      department: 'Administration',
      status: 'active',
      createdAt: new Date().toISOString(),
      isDefaultAdmin: true
    });

    // Mark admin as created
    await kv.set('setup:admin_created', {
      created: true,
      timestamp: new Date().toISOString(),
      adminId: data.user.id
    });

    console.log('✅ Default admin account created successfully');
    console.log('Email:', defaultAdminEmail);
    console.log('Password:', defaultAdminPassword);
    console.log('⚠️  CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!');

    return {
      success: true,
      credentials: {
        email: defaultAdminEmail,
        password: defaultAdminPassword
      }
    };

  } catch (err) {
    console.error('Setup error:', err);
    return { success: false, error: err.message };
  }
}

// Uncomment to run setup on server start (run only once)
// createDefaultAdmin();
