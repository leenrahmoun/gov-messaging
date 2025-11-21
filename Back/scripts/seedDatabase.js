const db = require('../db');
const bcrypt = require('bcryptjs');
const seedData = require('./seed-data.json');

const seedDatabase = async () => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    console.log('🌱 Starting database seeding...\n');

    // Seed Departments
    console.log('📂 Seeding departments...');
    for (const dept of seedData.departments) {
      await client.query(
        `INSERT INTO departments (id, name, description, created_at, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET name = $2, description = $3
         WHERE departments.id = $1;`,
        [dept.id, dept.name, dept.description]
      );
      console.log(`  ✓ ${dept.name}`);
    }

    // Seed Users
    console.log('\n👥 Seeding users...');
    for (const user of seedData.users) {
      const passwordHash = await bcrypt.hash(user.password, 10);

      // Find department_id if department is specified
      let departmentId = null;
      if (user.department) {
        const deptResult = await client.query(
          'SELECT id FROM departments WHERE name = $1',
          [user.department]
        );
        if (deptResult.rows.length > 0) {
          departmentId = deptResult.rows[0].id;
        }
      }

      // Generate username from email
      const username = user.email.split('@')[0];

      try {
        await client.query(
          `INSERT INTO users (username, email, password_hash, full_name, role, department_id, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (email) DO UPDATE SET 
            password_hash = $3, 
            full_name = $4, 
            role = $5, 
            department_id = $6,
            updated_at = CURRENT_TIMESTAMP
           WHERE users.email = $2;`,
          [username, user.email, passwordHash, user.full_name || user.name, user.role, departmentId]
        );
        console.log(`  ✓ ${user.name} (${user.role}${user.department ? ' - ' + user.department : ''})`);
      } catch (error) {
        if (error.code === '23505') {
          console.log(`  ⚠ ${user.name} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    await client.query('COMMIT');
    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error during seeding:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
  }
};

// Run seeding
seedDatabase();
