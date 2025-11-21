const db = require('../db');

(async () => {
  try {
    const names = ['HQ', 'AdminDept', 'HRDept'];
    for (const name of names) {
      await db.query('INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name]);
    }
    const res = await db.query('SELECT id, name FROM departments ORDER BY id');
    console.log('Departments:', res.rows);
  } catch (error) {
    console.error('Department seed failed:', error.message);
  } finally {
    await db.pool.end();
  }
})();
