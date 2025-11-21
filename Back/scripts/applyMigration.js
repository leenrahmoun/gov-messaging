const fs = require('fs');
const path = require('path');
const db = require('../db');

(async () => {
  const filePath = path.join(__dirname, '..', 'database', 'migrations', '2025-11-12-rebuild-core-schema.sql');
  console.log('Applying migration from', filePath);
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await db.query(sql);
    console.log('Migration applied successfully.');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await db.pool.end();
  }
})();
