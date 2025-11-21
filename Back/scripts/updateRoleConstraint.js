const db = require('../db');

(async () => {
  try {
    await db.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
    await db.query("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'user', 'employee'))");
    console.log('Role constraint updated.');
  } catch (error) {
    console.error('Failed to update role constraint:', error.message);
  } finally {
    await db.pool.end();
  }
})();
