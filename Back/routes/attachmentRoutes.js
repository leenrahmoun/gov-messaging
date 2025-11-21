const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachmentController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const db = require('../db');
const path = require('path');
const fs = require('fs');

// جميع Routes تتطلب مصادقة
router.use(authenticateToken);

/**
 * رفع مرفق لمراسلة
 */
router.post('/:messageId/upload', upload.single('file'), async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'الرجاء اختيار ملف للرفع'
      });
    }

    // التحقق من وجود المراسلة
    const messageCheck = await db.query(
      'SELECT id, sender_id, status FROM messages WHERE id = $1',
      [messageId]
    );

    if (messageCheck.rows.length === 0) {
      // حذف الملف إذا كانت المراسلة غير موجودة
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'المراسلة غير موجودة'
      });
    }

    const message = messageCheck.rows[0];

    // التحقق من الصلاحيات
    if (userRole !== 'admin' && userRole !== 'manager') {
      if (message.sender_id !== userId) {
        // حذف الملف إذا لم يكن المستخدم مرسل المراسلة
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(403).json({
          success: false,
          message: 'غير مصرح برفع مرفقات لهذه المراسلة'
        });
      }

      // التحقق من حالة المراسلة
      if (message.status === 'sent') {
        // حذف الملف إذا كانت المراسلة مرسلة
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(403).json({
          success: false,
          message: 'لا يمكن رفع مرفقات لمراسلة مرسلة'
        });
      }
    }

    // حفظ معلومات المرفق في قاعدة البيانات
    const result = await db.query(
      `INSERT INTO attachments (message_id, file_name, file_path, file_size, file_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        messageId,
        req.file.originalname,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        userId
      ]
    );

    res.status(201).json({
      success: true,
      message: 'تم رفع المرفق بنجاح',
      data: { attachment: result.rows[0] }
    });
  } catch (error) {
    console.error('خطأ في رفع المرفق:', error);
    
    // حذف الملف في حالة الخطأ
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'خطأ في رفع المرفق',
      error: error.message
    });
  }
});

// Routes المرفقات
router.get('/:messageId', attachmentController.getAttachments);
router.get('/download/:id', attachmentController.downloadAttachment);
router.delete('/:id', attachmentController.deleteAttachment);

module.exports = router;

