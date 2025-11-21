const fs = require('fs');
const path = require('path');
const db = require('../db');

/**
 * تهيئة قاعدة البيانات وإنشاء الجداول
 */
async function initDatabase() {
  try {
    console.log('بدء تهيئة قاعدة البيانات...');
    
    // قراءة ملف SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // تنفيذ الأوامر SQL
    await db.query(schema);
    
    console.log('✓ تم إنشاء الجداول بنجاح');
    console.log('✓ تم إنشاء الفهارس بنجاح');
    console.log('✓ تم إنشاء الدوال والمشغلات بنجاح');
    
    return true;
  } catch (error) {
    console.error('خطأ في تهيئة قاعدة البيانات:', error);
    throw error;
  }
}

// تشغيل التهيئة إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('تمت تهيئة قاعدة البيانات بنجاح!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('فشلت تهيئة قاعدة البيانات:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase };

