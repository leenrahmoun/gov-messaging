const db = require('../db');

(async () => {
  try {
    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
    `);
    await db.query(`UPDATE users SET status = 'active' WHERE status IS NULL;`);
    console.log('User status column ensured.');
  } catch (error) {
    console.error('Ensure status failed:', error.message);
  } finally {
    await db.pool.end();
  }
})();
