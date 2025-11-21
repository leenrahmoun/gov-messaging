const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken } = require('../middleware/auth');

// جميع Routes تتطلب مصادقة
router.use(authenticateToken);

// Routes سجل الأحداث
router.get('/', auditController.getAuditLogs);
router.get('/stats', auditController.getAuditStats);

module.exports = router;

