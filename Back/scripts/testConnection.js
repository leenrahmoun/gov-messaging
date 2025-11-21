require('dotenv').config();
const { Pool } = require('pg');

/**
 * Script لاختبار الاتصال بقاعدة البيانات
 */
async function testConnection() {
  console.log('🔍 اختبار الاتصال بقاعدة البيانات...');
  console.log('========================================');
  
  // التحقق من وجود DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ خطأ: DATABASE_URL غير موجود في ملف .env');
    console.log('📝 تأكد من وجود ملف .env وأنه يحتوي على DATABASE_URL');
    process.exit(1);
  }

  // إخفاء كلمة المرور في السجل
  const dbUrl = process.env.DATABASE_URL;
  const safeUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`📊 Database URL: ${safeUrl}`);
  console.log('========================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });

  try {
    // اختبار الاتصال
    console.log('⏳ محاولة الاتصال...');
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    
    console.log('✅ الاتصال ناجح!');
    console.log('========================================');
    console.log('🕐 الوقت الحالي:', result.rows[0].current_time);
    console.log('📦 إصدار PostgreSQL:', result.rows[0].pg_version.split(',')[0]);
    console.log('========================================\n');

    // التحقق من وجود قاعدة البيانات
    console.log('🔍 التحقق من وجود قاعدة البيانات gov_messaging...');
    const dbCheck = await pool.query(
      "SELECT datname FROM pg_database WHERE datname = 'gov_messaging'"
    );

    if (dbCheck.rows.length === 0) {
      console.log('⚠️  قاعدة البيانات gov_messaging غير موجودة');
      console.log('📝 قم بإنشائها باستخدام:');
      console.log('   CREATE DATABASE gov_messaging;');
    } else {
      console.log('✅ قاعدة البيانات gov_messaging موجودة');
      
      // التحقق من الجداول
      const tablesCheck = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'messages', 'recipients', 'attachments', 'approvals', 'audit_logs')
        ORDER BY table_name
      `);

      if (tablesCheck.rows.length === 0) {
        console.log('⚠️  الجداول غير موجودة');
        console.log('📝 قم بتشغيل: npm run init-db');
      } else {
        console.log('✅ الجداول موجودة:');
        tablesCheck.rows.forEach(row => {
          console.log(`   - ${row.table_name}`);
        });
      }
    }

    console.log('========================================');
    console.log('✅ جميع الاختبارات نجحت!');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في الاتصال!');
    console.log('========================================');
    console.error('📋 تفاصيل الخطأ:');
    console.error(`   الكود: ${error.code}`);
    console.error(`   الرسالة: ${error.message}`);
    console.log('========================================\n');

    // نصائح حسب نوع الخطأ
    if (error.code === '28P01') {
      console.log('💡 الحل:');
      console.log('   1. تحقق من كلمة المرور في ملف .env');
      console.log('   2. تأكد من أن كلمة المرور صحيحة');
      console.log('   3. راجع ملف TROUBLESHOOTING.md للحلول التفصيلية');
    } else if (error.code === '3D000') {
      console.log('💡 الحل:');
      console.log('   1. أنشئ قاعدة البيانات: CREATE DATABASE gov_messaging;');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 الحل:');
      console.log('   1. تأكد من تشغيل PostgreSQL');
      console.log('   2. تحقق من المنفذ (افتراضي 5432)');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 الحل:');
      console.log('   1. تحقق من إعدادات الشبكة');
      console.log('   2. تأكد من أن PostgreSQL يعمل');
    }

    process.exit(1);
  } finally {
    await pool.end();
  }
}

// تشغيل الاختبار
testConnection();

