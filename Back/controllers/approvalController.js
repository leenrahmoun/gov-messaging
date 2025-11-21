const db = require('../db');

/**
 * الحصول على قائمة الموافقات
 */
const getApprovals = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      message_id,
      approver_id
    } = req.query;

    const offset = (page - 1) * limit;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // If no status specified and user is manager/admin, default to pending
    // But allow explicit status filter to override
    // Handle empty string as undefined
    let actualStatus = status && status !== '' ? status : undefined;
    if (!actualStatus && (userRole === 'admin' || userRole === 'manager')) {
      actualStatus = 'pending'; // Default to pending for managers/admins
    }
    
    console.log(`[Approvals] User: ${userRole} (${userId}), Status filter: ${actualStatus || 'none'}`);

    let query = `
      SELECT a.*, m.subject as message_subject, m.message_number, u.full_name as approver_name
      FROM approvals a
      INNER JOIN messages m ON a.message_id = m.id
      INNER JOIN users u ON a.approver_id = u.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    // فلترة حسب الدور: المستخدمون العاديون يرون فقط موافقاتهم
    // Managers and Admins can see all approvals
    if (userRole !== 'admin' && userRole !== 'manager') {
      query += ` AND a.approver_id = $${paramCount++}`;
      values.push(userId);
    }

    // إضافة فلاتر
    if (actualStatus) {
      query += ` AND a.status = $${paramCount++}`;
      values.push(actualStatus);
    }

    if (message_id) {
      query += ` AND a.message_id = $${paramCount++}`;
      values.push(message_id);
    }

    if (approver_id && (userRole === 'admin' || userRole === 'manager')) {
      query += ` AND a.approver_id = $${paramCount++}`;
      values.push(approver_id);
    }

    // إضافة ترتيب وحدود
    query += ` ORDER BY a.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, values);

    // الحصول على العدد الإجمالي
    let countQuery = `
      SELECT COUNT(*) FROM approvals a WHERE 1=1
    `;
    const countValues = [];
    paramCount = 1;

    // Managers and Admins can see all approvals
    if (userRole !== 'admin' && userRole !== 'manager') {
      countQuery += ` AND a.approver_id = $${paramCount++}`;
      countValues.push(userId);
    }

    if (actualStatus) {
      countQuery += ` AND a.status = $${paramCount++}`;
      countValues.push(actualStatus);
    }

    if (message_id) {
      countQuery += ` AND a.message_id = $${paramCount++}`;
      countValues.push(message_id);
    }

    if (approver_id && (userRole === 'admin' || userRole === 'manager')) {
      countQuery += ` AND a.approver_id = $${paramCount++}`;
      countValues.push(approver_id);
    }

    const countResult = await db.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);

    console.log(`[Approvals] Query returned ${result.rows.length} approvals (total: ${total})`);
    if (result.rows.length > 0) {
      console.log(`[Approvals] Sample approval:`, {
        id: result.rows[0].id,
        message_id: result.rows[0].message_id,
        status: result.rows[0].status,
        message_subject: result.rows[0].message_subject
      });
    }

    res.json({
      success: true,
      data: {
        approvals: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('خطأ في جلب الموافقات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الموافقات',
      error: error.message
    });
  }
};

/**
 * الحصول على موافقة محددة
 */
const getApprovalById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await db.query(
      `SELECT a.*, m.subject as message_subject, m.message_number, m.content as message_content,
              u.full_name as approver_name, u2.full_name as sender_name
       FROM approvals a
       INNER JOIN messages m ON a.message_id = m.id
       INNER JOIN users u ON a.approver_id = u.id
       INNER JOIN users u2 ON m.sender_id = u2.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الموافقة غير موجودة'
      });
    }

    const approval = result.rows[0];

    // التحقق من الصلاحيات
    // Managers and Admins can view any approval
    // Regular users can only view approvals assigned to them
    if (userRole !== 'admin' && userRole !== 'manager') {
      if (approval.approver_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح بالوصول إلى هذه الموافقة'
        });
      }
    }

    res.json({
      success: true,
      data: { approval: result.rows[0] }
    });
  } catch (error) {
    console.error('خطأ في جلب الموافقة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الموافقة',
      error: error.message
    });
  }
};

/**
 * الموافقة على مراسلة
 */
const approveMessage = async (req, res) => {
  try {
    const { id } = req.params; // approval id
    const { comments } = req.body;
    const userId = req.user.id;
    const rawRole = req.user.role;
    const userRole = rawRole; // keep original role strings from DB

    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ success: false, message: 'غير مصرح بالموافقة على المراسلات' });
    }

    // Load approval and related message
    const approvalResult = await db.query(
      `SELECT a.*, m.status as message_status, m.sender_id, m.sender_department_id, m.requires_approval
       FROM approvals a
       INNER JOIN messages m ON a.message_id = m.id
       WHERE a.id = $1`,
      [id]
    );

    if (approvalResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'الموافقة غير موجودة' });
    }

    const approval = approvalResult.rows[0];

    if (approval.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'الموافقة معالجة بالفعل' });
    }

    const ADMIN_APPROVAL_REQUIRED = (process.env.ADMIN_APPROVAL_REQUIRED === 'true');

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Mark this approval as approved
      await client.query(
        `UPDATE approvals SET status = 'approved', comments = $1, approved_at = CURRENT_TIMESTAMP, updated_at = NOW() WHERE id = $2`,
        [comments || null, id]
      );

      // If approver is manager
      if (userRole === 'manager') {
        if (ADMIN_APPROVAL_REQUIRED) {
          // Move message to pending admin approval and create admin approval entry if not exists
          await client.query(
            `UPDATE messages SET status = 'pending_admin_approval', updated_at = NOW() WHERE id = $1`,
            [approval.message_id]
          );

          // Ensure there is a pending admin approval (avoid duplicates)
          const adminCheck = await client.query(
            `SELECT id FROM approvals WHERE message_id = $1 AND (SELECT role FROM users WHERE id = approver_id) = 'admin' AND status = 'pending' LIMIT 1`,
            [approval.message_id]
          );

          if (adminCheck.rows.length === 0) {
            // pick any active admin
            const adminResult = await client.query(
              `SELECT id FROM users WHERE role = 'admin' AND is_active = TRUE LIMIT 1`
            );
            if (adminResult.rows.length > 0) {
              await client.query(
                `INSERT INTO approvals (message_id, approver_id, status, comments, created_at) VALUES ($1, $2, 'pending', NULL, NOW())`,
                [approval.message_id, adminResult.rows[0].id]
              );
            }
          }
        } else {
          // Final approval by manager -> mark message approved
          await client.query(
            `UPDATE messages SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = NOW() WHERE id = $2`,
            [userId, approval.message_id]
          );
        }
      } else if (userRole === 'admin') {
        // Admin approval -> final
        await client.query(
          `UPDATE messages SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = NOW() WHERE id = $2`,
          [userId, approval.message_id]
        );
      }

      await client.query('COMMIT');

      res.json({ success: true, message: 'تم الموافقة على المراسلة بنجاح' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('خطأ في الموافقة على المراسلة:', error);
    res.status(500).json({ success: false, message: 'خطأ في الموافقة على المراسلة', error: error.message });
  }
};

/**
 * رفض مراسلة
 */
const rejectMessage = async (req, res) => {
  try {
    const { id } = req.params; // approval id
    const { comments } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ success: false, message: 'غير مصرح برفض المراسلات' });
    }

    if (!comments) {
      return res.status(400).json({ success: false, message: 'الرجاء إدخال سبب الرفض' });
    }

    const approvalResult = await db.query(
      `SELECT a.*, m.status as message_status, m.sender_id, m.sender_department_id
       FROM approvals a
       INNER JOIN messages m ON a.message_id = m.id
       WHERE a.id = $1`,
      [id]
    );

    if (approvalResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'الموافقة غير موجودة' });
    }

    const approval = approvalResult.rows[0];

    if (approval.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'الموافقة معالجة بالفعل' });
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // mark approval rejected
      await client.query(
        `UPDATE approvals SET status = 'rejected', comments = $1, approved_at = CURRENT_TIMESTAMP, updated_at = NOW() WHERE id = $2`,
        [comments, id]
      );

      if (userRole === 'manager') {
        // Manager rejection -> return to employee for revision
        await client.query(
          `UPDATE messages SET status = 'returned_for_revision', updated_at = NOW() WHERE id = $1`,
          [approval.message_id]
        );
      } else if (userRole === 'admin') {
        // Admin rejection -> return to manager for rework
        // Find manager for the sender's department
        const mgrResult = await client.query(
          `SELECT id FROM users WHERE role = 'manager' AND department_id = $1 AND is_active = TRUE LIMIT 1`,
          [approval.sender_department_id]
        );

        if (mgrResult.rows.length > 0) {
          const mgrId = mgrResult.rows[0].id;

          // set message back to pending_manager_approval
          await client.query(
            `UPDATE messages SET status = 'pending_manager_approval', updated_at = NOW() WHERE id = $1`,
            [approval.message_id]
          );

          // create a new approval for the manager (if no pending exists)
          const existing = await client.query(
            `SELECT id FROM approvals WHERE message_id = $1 AND approver_id = $2 AND status = 'pending' LIMIT 1`,
            [approval.message_id, mgrId]
          );

          if (existing.rows.length === 0) {
            await client.query(
              `INSERT INTO approvals (message_id, approver_id, status, comments, created_at) VALUES ($1, $2, 'pending', NULL, NOW())`,
              [approval.message_id, mgrId]
            );
          }
        } else {
          // No manager found - return to sender as fallback
          await client.query(
            `UPDATE messages SET status = 'returned_for_revision', updated_at = NOW() WHERE id = $1`,
            [approval.message_id]
          );
        }
      }

      await client.query('COMMIT');

      res.json({ success: true, message: 'تم رفض المراسلة بنجاح' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('خطأ في رفض المراسلة:', error);
    res.status(500).json({ success: false, message: 'خطأ في رفض المراسلة', error: error.message });
  }
};

module.exports = {
  getApprovals,
  getApprovalById,
  approveMessage,
  rejectMessage
};

