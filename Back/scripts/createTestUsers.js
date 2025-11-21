#!/usr/bin/env node
/**
 * Script to create test users and departments for e2e testing
 * Usage: node scripts/createTestUsers.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../db');
const fs = require('fs');
const path = require('path');

const DEPARTMENTS_DATA = [
  { name: 'HR', shortCode: 'HR' },
  { name: 'Finance', shortCode: 'FIN' },
  { name: 'IT', shortCode: 'IT' },
  { name: 'Legal', shortCode: 'LEG' },
  { name: 'Operations', shortCode: 'OPS' }
];

const TEST_PASSWORD = 'testpass123';

// Helper: hash password
const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

// Helper: random delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createTestUsers() {
  let client;
  try {
    console.log('🚀 Starting test users creation...\n');

    client = await db.getClient();
    await client.query('BEGIN');

    // 1. Create departments
    console.log('📁 Creating departments...');
    const createdDepartments = [];

    for (const dept of DEPARTMENTS_DATA) {
      const result = await client.query(
        `INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO NOTHING
         RETURNING id, name`,
        [dept.name]
      );

      if (result.rows.length > 0) {
        createdDepartments.push(result.rows[0]);
        console.log(`   ✓ ${dept.name}`);
      } else {
        // Department already exists, fetch it
        const existing = await client.query(
          `SELECT id, name FROM departments WHERE name = $1`,
          [dept.name]
        );
        if (existing.rows.length > 0) {
          createdDepartments.push(existing.rows[0]);
          console.log(`   ✓ ${dept.name} (already exists)`);
        }
      }
    }

    // 2. Create admin
    console.log('\n👤 Creating Admin user...');
    const adminPassword = await hashPassword(TEST_PASSWORD);
    const adminResult = await client.query(
      `INSERT INTO users (username, email, password_hash, full_name, role, is_active, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (username) DO NOTHING
       RETURNING id, username, email`,
      [
        'admin_test',
        'admin.test@gov.local',
        adminPassword,
        'Admin Test User',
        'admin',
        true,
        'active'
      ]
    );
    const adminUser = adminResult.rows.length > 0 ? adminResult.rows[0] : null;
    if (adminUser) {
      console.log(`   ✓ admin_test (${adminUser.email})`);
    } else {
      console.log('   ✓ admin_test (already exists)');
    }

    // 3. Create users per department
    console.log('\n👥 Creating department users...');
    const allUsers = [];

    for (const dept of createdDepartments) {
      console.log(`\n   Department: ${dept.name}`);

      // Create 1 manager
      const managerUsername = `manager_${dept.name.toLowerCase().replace(/\s+/g, '_')}`;
      const managerPassword = await hashPassword(TEST_PASSWORD);
      const managerResult = await client.query(
        `INSERT INTO users (username, email, password_hash, full_name, role, department_id, is_active, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (username) DO NOTHING
         RETURNING id, username, email, role, department_id`,
        [
          managerUsername,
          `${managerUsername}@gov.local`,
          managerPassword,
          `Manager - ${dept.name}`,
          'manager',
          dept.id,
          true,
          'active'
        ]
      );

      if (managerResult.rows.length > 0) {
        const manager = managerResult.rows[0];
        allUsers.push({
          id: manager.id,
          username: manager.username,
          email: manager.email,
          role: manager.role,
          department_id: manager.department_id,
          password: TEST_PASSWORD
        });
        console.log(`      ✓ Manager: ${manager.username}`);

        // Update department manager_id
        await client.query(`UPDATE departments SET manager_id = $1 WHERE id = $2`, [manager.id, dept.id]);
      }

      // Create 3 employees
      for (let i = 1; i <= 3; i++) {
        const empUsername = `emp_${dept.name.toLowerCase().replace(/\s+/g, '_')}_${i}`;
        const empPassword = await hashPassword(TEST_PASSWORD);
        const empResult = await client.query(
          `INSERT INTO users (username, email, password_hash, full_name, role, department_id, is_active, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (username) DO NOTHING
           RETURNING id, username, email, role, department_id`,
          [
            empUsername,
            `${empUsername}@gov.local`,
            empPassword,
            `Employee ${i} - ${dept.name}`,
            'employee',
            dept.id,
            true,
            'active'
          ]
        );

        if (empResult.rows.length > 0) {
          const emp = empResult.rows[0];
          allUsers.push({
            id: emp.id,
            username: emp.username,
            email: emp.email,
            role: emp.role,
            department_id: emp.department_id,
            password: TEST_PASSWORD
          });
          console.log(`      ✓ Employee: ${emp.username}`);
        }
      }
    }

    // Add admin to allUsers if created
    if (adminUser) {
      allUsers.unshift({
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: 'admin',
        department_id: null,
        password: TEST_PASSWORD
      });
    }

    await client.query('COMMIT');

    // Save to JSON file
    const outputPath = path.join(__dirname, '..', 'test-users.json');
    const testUsersJson = {
      created_at: new Date().toISOString(),
      password: TEST_PASSWORD,
      note: 'Test users for development/testing only. DO NOT use in production.',
      users: allUsers,
      departments: createdDepartments
    };

    fs.writeFileSync(outputPath, JSON.stringify(testUsersJson, null, 2));

    console.log(`\n✅ Test users created successfully!`);
    console.log(`\n📋 Summary:`);
    console.log(`   Departments: ${createdDepartments.length}`);
    console.log(`   Users: ${allUsers.length}`);
    console.log(`   Admin: 1`);
    console.log(`   Managers: ${createdDepartments.length}`);
    console.log(`   Employees: ${createdDepartments.length * 3}`);
    console.log(`\n🔑 Password for all test users: ${TEST_PASSWORD}`);
    console.log(`\n📄 Test users saved to: ${outputPath}`);
    console.log(`\n💡 Usage:`);
    console.log(`   1. Login with any test user (e.g., admin_test)`);
    console.log(`   2. Create messages and test approval workflows`);
    console.log(`   3. Test role-based recipient filtering`);
    console.log(`\n`);

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('❌ Error creating test users:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await db.end();
    process.exit(0);
  }
}

// Run
createTestUsers();
