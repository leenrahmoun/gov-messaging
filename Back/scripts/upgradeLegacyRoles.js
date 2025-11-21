const db = require('../db');

(async () => {
  try {
    const res = await db.query("UPDATE users SET role = 'employee' WHERE role = 'user'");
    console.log(`Updated ${res.rowCount} legacy users.`);
  } catch (error) {
    console.error('Upgrade failed:', error.message);
  } finally {
    await db.pool.end();
  }
})();
