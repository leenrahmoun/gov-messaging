const db = require('../db');

(async () => {
  try {
    const res = await db.query("UPDATE users SET role = 'employee' WHERE role NOT IN ('admin', 'manager', 'employee')");
    console.log(`Roles normalized: ${res.rowCount} rows updated.`);
  } catch (error) {
    console.error('Normalization failed:', error.message);
  } finally {
    await db.pool.end();
  }
})();
