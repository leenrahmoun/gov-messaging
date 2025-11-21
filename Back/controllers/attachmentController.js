const db = require('../db');
const fs = require('fs');
const path = require('path');

/**
 * الحصول على قائمة المرفقات لمراسلة
 */
const getAttachments = async (req, res) => {
  try {
    const { messageId } = req.params;

    // التحقق من وجود المراسلة
    const messageCheck = await db.query(
      'SELECT id, sender_id FROM messages WHERE id = $1',
      [messageId]
    );

    if (messageCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المراسلة غير موجودة'
      });
    }

    const message = messageCheck.rows[0];
    const userId = req.user.id;
    const userRole = req.user.role;

    // التحقق من الصلاحيات
    if (userRole !== 'admin' && userRole !== 'manager') {
      if (message.sender_id !== userId) {
        // التحقق من أن المستخدم مستلم
        const recipientCheck = await db.query(
          'SELECT id FROM recipients WHERE message_id = $1 AND recipient_id = $2',
          [messageId, userId]
        );

        if (recipientCheck.rows.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'غير مصرح بالوصول إلى مرفقات هذه المراسلة'
          });
        }
      }
    }

    // جلب المرفقات
    const result = await db.query(
      `SELECT a.*, u.full_name as uploaded_by_name
       FROM attachments a
       INNER JOIN users u ON a.uploaded_by = u.id
       WHERE a.message_id = $1
       ORDER BY a.created_at DESC`,
      [messageId]
    );

    res.json({
      success: true,
      data: { attachments: result.rows }
    });
  } catch (error) {
    console.error('خطأ في جلب المرفقات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المرفقات',
      error: error.message
    });
  }
};

/**
 * تحميل مرفق
 */
const downloadAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    // جلب معلومات المرفق
    const result = await db.query(
      `SELECT a.*, m.sender_id
       FROM attachments a
       INNER JOIN messages m ON a.message_id = m.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المرفق غير موجود'
      });
    }

    const attachment = result.rows[0];
    const userId = req.user.id;
    const userRole = req.user.role;

    // التحقق من الصلاحيات
    if (userRole !== 'admin' && userRole !== 'manager') {
      if (attachment.sender_id !== userId) {
        // التحقق من أن المستخدم مستلم
        const recipientCheck = await db.query(
          'SELECT id FROM recipients WHERE message_id = $1 AND recipient_id = $2',
          [attachment.message_id, userId]
        );

        if (recipientCheck.rows.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'غير مصرح بتحميل هذا المرفق'
          });
        }
      }
    }

    // التحقق من وجود الملف
    const filePath = path.join(attachment.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'الملف غير موجود على الخادم'
      });
    }

    // إرسال الملف
    res.download(filePath, attachment.file_name, (err) => {
      if (err) {
        console.error('خطأ في تحميل الملف:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'خطأ في تحميل الملف'
          });
        }
      }
    });
  } catch (error) {
    console.error('خطأ في تحميل المرفق:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحميل المرفق',
      error: error.message
    });
  }
};

/**
 * حذف مرفق
 */
const deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // جلب معلومات المرفق
    const result = await db.query(
      `SELECT a.*, m.sender_id
       FROM attachments a
       INNER JOIN messages m ON a.message_id = m.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المرفق غير موجود'
      });
    }

    const attachment = result.rows[0];

    // التحقق من الصلاحيات
    if (userRole !== 'admin' && userRole !== 'manager') {
      if (attachment.sender_id !== userId && attachment.uploaded_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح بحذف هذا المرفق'
        });
      }

      // التحقق من حالة المراسلة
      const messageCheck = await db.query(
        'SELECT status FROM messages WHERE id = $1',
        [attachment.message_id]
      );

      if (messageCheck.rows.length > 0 && messageCheck.rows[0].status === 'sent') {
        return res.status(403).json({
          success: false,
          message: 'لا يمكن حذف مرفق من مراسلة مرسلة'
        });
      }
    }

    // حذف الملف من النظام
    const filePath = path.join(attachment.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // حذف المرفق من قاعدة البيانات
    await db.query('DELETE FROM attachments WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'تم حذف المرفق بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف المرفق:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف المرفق',
      error: error.message
    });
  }
};

module.exports = {
  getAttachments,
  downloadAttachment,
  deleteAttachment
};

