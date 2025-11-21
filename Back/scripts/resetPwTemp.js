const dotenv = require('dotenv');
dotenv.config();
const { Pool } = require('pg');
(async ()=>{
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.connect();
    const hash = '$2a$10$JVQ9y7PX4SE/Z17wEcIt8O2Wvxb6JqO3H80NEhf31tkPF49TFUpAG';
    const q = "UPDATE users SET password = $1 WHERE username = $2 OR email = $3 RETURNING id, username, email";
    const res = await pool.query(q, [hash, process.env.ADMIN_USERNAME || 'admin', process.env.ADMIN_EMAIL || 'admin@gov.ma']);
    console.log('Updated rows:', res.rows);
  } catch (err) {
    console.error('Error updating password:', err.message || err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
