const db = require('../db');

(async () => {
  try {
    await db.query(`ALTER TABLE departments ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES users(id);`);
    await db.query(`ALTER TABLE departments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`);
    await db.query(`ALTER TABLE departments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`);

    await db.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS sender_department_id INTEGER REFERENCES departments(id);
    `);
    await db.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS receiver_department_id INTEGER REFERENCES departments(id);
    `);
    await db.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);
    `);
    await db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;`);
    await db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;`);

    await db.query(`
      ALTER TABLE approvals
      ADD COLUMN IF NOT EXISTS decision VARCHAR(20);
    `);
    await db.query(`
      ALTER TABLE approvals
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `);

    await db.query(`
      ALTER TABLE audit_logs
      ADD COLUMN IF NOT EXISTS action_type VARCHAR(100);
    `);
    await db.query(`
      ALTER TABLE audit_logs
      ADD COLUMN IF NOT EXISTS metadata JSONB;
    `);

    console.log('Schema aligned for QA tests.');
  } catch (error) {
    console.error('Schema alignment failed:', error.message);
  } finally {
    await db.pool.end();
  }
})();
