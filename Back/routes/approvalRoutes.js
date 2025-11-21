const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const { authenticateToken } = require('../middleware/auth');

// جميع Routes تتطلب مصادقة
router.use(authenticateToken);

// Routes الموافقات
router.get('/', approvalController.getApprovals);
router.get('/:id', approvalController.getApprovalById);
router.post('/:id/approve', approvalController.approveMessage);
router.post('/:id/reject', approvalController.rejectMessage);

module.exports = router;

