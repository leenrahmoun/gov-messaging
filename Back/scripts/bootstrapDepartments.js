const db = require('../db');

(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) UNIQUE NOT NULL
      );
    `);
    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id);
    `);
    console.log('Departments bootstrap complete.');
  } catch (error) {
    console.error('Bootstrap failed:', error.message);
  } finally {
    await db.pool.end();
  }
})();
