const db = require('../db');

/**
 * Middleware لتسجيل الأحداث في Audit Log
 */
const auditLog = async (req, res, next) => {
  // استثناء بعض المسارات من التسجيل
  const excludePaths = ['/health', '/'];
  if (excludePaths.includes(req.path)) {
    return next();
  }

  // حفظ الدالة الأصلية لـ res.json
  const originalJson = res.json.bind(res);
  
  // استبدال res.json لتسجيل الحدث بعد الإرسال
  res.json = async function(data) {
    try {
      // الحصول على معلومات الطلب
      const userId = req.user ? req.user.id : null;
      const action = req.method + ' ' + req.path;
      const entityType = getEntityType(req.path);
      const entityId = getEntityId(req, data);
      const description = generateDescription(req, data);
      const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      const userAgent = req.get('user-agent') || 'Unknown';

      // تسجيل الحدث في قاعدة البيانات (فقط للعمليات المهمة أو للمستخدمين المسجلين)
      const shouldLog = userId || 
                       action.includes('POST') || 
                       action.includes('PUT') || 
                       action.includes('PATCH') || 
                       action.includes('DELETE') ||
                       req.path.includes('/audit');

      if (shouldLog) {
        await db.query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, description, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userId, action, entityType, entityId, description, ipAddress, userAgent]
        );
      }
    } catch (error) {
      console.error('خطأ في تسجيل Audit Log:', error);
      // لا نوقف العملية إذا فشل التسجيل
    }
    
    // استدعاء الدالة الأصلية
    return originalJson(data);
  };
  
  next();
};

/**
 * تحديد نوع الكيان من المسار
 */
function getEntityType(path) {
  if (path.includes('/users')) return 'user';
  if (path.includes('/messages')) return 'message';
  if (path.includes('/attachments')) return 'attachment';
  if (path.includes('/approvals')) return 'approval';
  if (path.includes('/auth')) return 'auth';
  return 'system';
}

/**
 * الحصول على معرف الكيان من الطلب أو الاستجابة
 */
function getEntityId(req, data) {
  // من معاملات المسار
  if (req.params.id) return parseInt(req.params.id);
  if (req.params.messageId) return parseInt(req.params.messageId);
  if (req.params.userId) return parseInt(req.params.userId);
  
  // من بيانات الاستجابة
  if (data && data.data && data.data.id) return data.data.id;
  if (data && data.user && data.user.id) return data.user.id;
  if (data && data.message && data.message.id) return data.message.id;
  
  return null;
}

/**
 * إنشاء وصف للحدث
 */
function generateDescription(req, data) {
  const method = req.method;
  const path = req.path;
  
  if (method === 'POST') {
    if (path.includes('/auth/register')) return 'تسجيل مستخدم جديد';
    if (path.includes('/auth/login')) return 'تسجيل دخول';
    if (path.includes('/messages')) return 'إنشاء مراسلة جديدة';
    if (path.includes('/attachments')) return 'رفع مرفق';
  }
  
  if (method === 'PUT' || method === 'PATCH') {
    if (path.includes('/messages')) return 'تحديث مراسلة';
    if (path.includes('/approvals')) return 'تحديث موافقة';
  }
  
  if (method === 'DELETE') {
    if (path.includes('/messages')) return 'حذف مراسلة';
    if (path.includes('/attachments')) return 'حذف مرفق';
  }
  
  if (method === 'GET') {
    if (path.includes('/messages')) return 'عرض مراسلة';
    if (path.includes('/audit-logs')) return 'عرض سجل الأحداث';
  }
  
  return `${method} ${path}`;
}

module.exports = { auditLog };

