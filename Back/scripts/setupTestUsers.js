const bcrypt = require('bcryptjs');
const db = require('../db');

const testUsers = [
  { username: 'admin1', password: '123456', role: 'admin', department: 'HQ', fullName: 'Admin One', email: 'admin1@example.com' },
  { username: 'mgr1', password: '123456', role: 'manager', department: 'AdminDept', fullName: 'Manager One', email: 'mgr1@example.com' },
  { username: 'emp1', password: '123456', role: 'employee', department: 'AdminDept', fullName: 'Employee One', email: 'emp1@example.com' },
  { username: 'emp2', password: '123456', role: 'employee', department: 'HRDept', fullName: 'Employee Two', email: 'emp2@example.com' },
];

(async () => {
  try {
    const deptRes = await db.query('SELECT id, name FROM departments');
    const departments = Object.fromEntries(deptRes.rows.map((d) => [d.name, d.id]));

    for (const user of testUsers) {
      const departmentId = departments[user.department];
      if (!departmentId) {
        console.warn(`Department ${user.department} not found; skipping ${user.username}`);
        continue;
      }

      const passwordHash = await bcrypt.hash(user.password, 10);
      const existing = await db.query('SELECT id FROM users WHERE username = $1', [user.username]);
      if (existing.rows.length) {
        await db.query(
          `UPDATE users
           SET email = $1,
               password_hash = $2,
               full_name = $3,
               role = $4,
               department = $5,
               department_id = $6,
               status = 'active',
               is_active = true,
               updated_at = NOW()
           WHERE id = $7`,
          [user.email, passwordHash, user.fullName, user.role, user.department, departmentId, existing.rows[0].id]
        );
        console.log(`Updated user ${user.username}`);
      } else {
        await db.query(
          `INSERT INTO users (username, email, password_hash, full_name, role, department, department_id, is_active, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true, 'active')`,
          [user.username, user.email, passwordHash, user.fullName, user.role, user.department, departmentId]
        );
        console.log(`Inserted user ${user.username}`);
      }
    }

    const finalUsers = await db.query('SELECT id, username, role, department, department_id FROM users WHERE username = ANY($1::text[])', [testUsers.map((u) => u.username)]);
    console.table(finalUsers.rows);
  } catch (error) {
    console.error('Setup test users failed:', error.message);
  } finally {
    await db.pool.end();
  }
})();
