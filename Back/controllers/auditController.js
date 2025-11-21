const db = require('../db');

/**
 * الحصول على سجل الأحداث (Audit Log)
 */
const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      user_id,
      entity_type,
      entity_id,
      action,
      start_date,
      end_date
    } = req.query;

    const offset = (page - 1) * limit;
    const userId = req.user.id;
    const userRole = req.user.role;

    // فقط المديرون والمسؤولون يمكنهم رؤية سجل الأحداث
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح بالوصول إلى سجل الأحداث'
      });
    }

    let query = `
      SELECT al.*, u.username, u.full_name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    // إضافة فلاتر
    if (user_id) {
      query += ` AND al.user_id = $${paramCount++}`;
      values.push(user_id);
    }

    if (entity_type) {
      query += ` AND al.entity_type = $${paramCount++}`;
      values.push(entity_type);
    }

    if (entity_id) {
      query += ` AND al.entity_id = $${paramCount++}`;
      values.push(entity_id);
    }

    if (action) {
      query += ` AND al.action LIKE $${paramCount++}`;
      values.push(`%${action}%`);
    }

    if (start_date) {
      query += ` AND al.created_at >= $${paramCount++}`;
      values.push(start_date);
    }

    if (end_date) {
      query += ` AND al.created_at <= $${paramCount++}`;
      values.push(end_date);
    }

    // إضافة ترتيب وحدود
    query += ` ORDER BY al.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, values);

    // الحصول على العدد الإجمالي
    let countQuery = `SELECT COUNT(*) FROM audit_logs al WHERE 1=1`;
    const countValues = [];
    paramCount = 1;

    if (user_id) {
      countQuery += ` AND al.user_id = $${paramCount++}`;
      countValues.push(user_id);
    }

    if (entity_type) {
      countQuery += ` AND al.entity_type = $${paramCount++}`;
      countValues.push(entity_type);
    }

    if (entity_id) {
      countQuery += ` AND al.entity_id = $${paramCount++}`;
      countValues.push(entity_id);
    }

    if (action) {
      countQuery += ` AND al.action LIKE $${paramCount++}`;
      countValues.push(`%${action}%`);
    }

    if (start_date) {
      countQuery += ` AND al.created_at >= $${paramCount++}`;
      countValues.push(start_date);
    }

    if (end_date) {
      countQuery += ` AND al.created_at <= $${paramCount++}`;
      countValues.push(end_date);
    }

    const countResult = await db.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        audit_logs: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('خطأ في جلب سجل الأحداث:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب سجل الأحداث',
      error: error.message
    });
  }
};

/**
 * الحصول على إحصائيات سجل الأحداث
 */
const getAuditStats = async (req, res) => {
  try {
    const userRole = req.user.role;

    // فقط المديرون والمسؤولون يمكنهم رؤية الإحصائيات
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح بالوصول إلى إحصائيات سجل الأحداث'
      });
    }

    // إحصائيات حسب نوع الكيان
    const entityStats = await db.query(`
      SELECT entity_type, COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY entity_type
      ORDER BY count DESC
    `);

    // إحصائيات حسب الإجراء
    const actionStats = await db.query(`
      SELECT 
        CASE 
          WHEN action LIKE 'GET%' THEN 'GET'
          WHEN action LIKE 'POST%' THEN 'POST'
          WHEN action LIKE 'PUT%' THEN 'PUT'
          WHEN action LIKE 'DELETE%' THEN 'DELETE'
          ELSE 'OTHER'
        END as action_type,
        COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY action_type
      ORDER BY count DESC
    `);

    // إحصائيات حسب المستخدم
    const userStats = await db.query(`
      SELECT u.username, u.full_name, COUNT(*) as count
      FROM audit_logs al
      INNER JOIN users u ON al.user_id = u.id
      WHERE al.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY u.id, u.username, u.full_name
      ORDER BY count DESC
      LIMIT 10
    `);

    // عدد الأحداث اليوم
    const todayCount = await db.query(`
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= CURRENT_DATE
    `);

    res.json({
      success: true,
      data: {
        entity_stats: entityStats.rows,
        action_stats: actionStats.rows,
        user_stats: userStats.rows,
        today_count: parseInt(todayCount.rows[0].count)
      }
    });
  } catch (error) {
    console.error('خطأ في جلب إحصائيات سجل الأحداث:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات سجل الأحداث',
      error: error.message
    });
  }
};

module.exports = {
  getAuditLogs,
  getAuditStats
};

