require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../db');

/**
 * Comprehensive Admin Login Fix Script
 * This script:
 * 1. Checks if admin user exists
 * 2. Creates admin if it doesn't exist
 * 3. Resets password if it exists
 * 4. Ensures user is active
 * 5. Verifies the credentials work
 */
async function fixAdminLogin() {
  try {
    console.log('🔧 Admin Login Fix Script');
    console.log('========================\n');

    const username = process.env.ADMIN_USERNAME || 'admin';
    const email = process.env.ADMIN_EMAIL || 'admin@gov.ma';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const full_name = process.env.ADMIN_FULL_NAME || 'System Administrator';
    const department = process.env.ADMIN_DEPARTMENT || 'IT Department';

    console.log('Checking admin user...');
    console.log(`  Username: ${username}`);
    console.log(`  Email: ${email}\n`);

    // Check if user exists
    const existingUser = await db.query(
      'SELECT id, username, email, role, is_active, password_hash FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      console.log(`✅ Admin user found (ID: ${user.id})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.is_active}\n`);

      // Ensure user is active
      if (!user.is_active) {
        console.log('⚠️  User is inactive. Activating...');
        await db.query('UPDATE users SET is_active = true WHERE id = $1', [user.id]);
        console.log('✅ User activated\n');
      }

      // Ensure user has admin role
      if (user.role !== 'admin') {
        console.log(`⚠️  User role is "${user.role}". Changing to admin...`);
        await db.query('UPDATE users SET role = $1 WHERE id = $2', ['admin', user.id]);
        console.log('✅ Role updated to admin\n');
      }

      // Reset password
      console.log('Resetting password...');
      const password_hash = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [password_hash, user.id]
      );
      console.log('✅ Password reset\n');
    } else {
      console.log('⚠️  Admin user not found. Creating new admin user...\n');
      
      // Create new admin user
      const password_hash = await bcrypt.hash(password, 10);
      const result = await db.query(
        `INSERT INTO users (username, email, password_hash, full_name, role, department, is_active)
         VALUES ($1, $2, $3, $4, 'admin', $5, true)
         RETURNING id, username, email, full_name, role`,
        [username, email, password_hash, full_name, department]
      );

      console.log('✅ Admin user created successfully!\n');
    }

    // Verify credentials
    console.log('Verifying credentials...');
    const verifyUser = await db.query(
      'SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (verifyUser.rows.length === 0) {
      console.error('❌ Failed to verify user');
      process.exitCode = 1;
      return;
    }

    const verify = verifyUser.rows[0];
    const isPasswordValid = await bcrypt.compare(password, verify.password_hash);

    if (!isPasswordValid) {
      console.error('❌ Password verification failed');
      process.exitCode = 1;
      return;
    }

    // Success!
    console.log('✅ Credentials verified successfully!\n');
    console.log('========================================');
    console.log('✅ Admin Login Fixed!');
    console.log('========================================');
    console.log('Login Credentials:');
    console.log(`  Username: ${verify.username}`);
    console.log(`  Email: ${verify.email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Role: ${verify.role}`);
    console.log(`  Active: ${verify.is_active}`);
    console.log('========================================\n');
    console.log('You can now login with these credentials.');
    console.log('⚠️  Please change the password after first login!\n');

  } catch (error) {
    console.error('❌ Error fixing admin login:', error.message);
    console.error(error);
    process.exitCode = 1;
  } finally {
    process.exit(0);
  }
}

// Run the script
fixAdminLogin();

