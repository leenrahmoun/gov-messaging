require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../db');

/**
 * إنشاء مستخدم مسؤول أولي
 */
async function createAdmin() {
  try {
    console.log('بدء إنشاء مستخدم المسؤول...');

    const username = process.env.ADMIN_USERNAME || 'admin';
    const email = process.env.ADMIN_EMAIL || 'admin@gov.ma';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const full_name = process.env.ADMIN_FULL_NAME || 'مدير النظام';
    const department = process.env.ADMIN_DEPARTMENT || 'إدارة تقنية المعلومات';

    // التحقق من وجود المستخدم
    const existingUser = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️  مستخدم المسؤول موجود بالفعل');
      return;
    }

    // تشفير كلمة المرور
    const password_hash = await bcrypt.hash(password, 10);

    // إدراج المستخدم
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, 'admin', true)
       RETURNING id, username, email, full_name, role`,
      [username, email, password_hash, full_name]
    );

    console.log('✅ تم إنشاء مستخدم المسؤول بنجاح!');
    console.log('========================================');
    console.log('معلومات المستخدم:');
    console.log(`اسم المستخدم: ${result.rows[0].username}`);
    console.log(`البريد الإلكتروني: ${result.rows[0].email}`);
    console.log(`الاسم الكامل: ${result.rows[0].full_name}`);
    console.log(`الدور: ${result.rows[0].role}`);
    console.log(`كلمة المرور: ${password}`);
    console.log('========================================');
    console.log('⚠️  يرجى تغيير كلمة المرور بعد أول تسجيل دخول!');
  } catch (error) {
    console.error('❌ خطأ في إنشاء مستخدم المسؤول:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// تشغيل الدالة
createAdmin();

