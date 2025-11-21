const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// جميع Routes تتطلب مصادقة
router.use(authenticateToken);

// مسارات عامة للحصول على بيانات مساعدة
router.get('/meta/departments', userController.listDepartments);
router.get('/meta/recipients', userController.getRecipients);
// Backwards-compatible route: /api/users/recipients (preferred)
router.get('/recipients', userController.getRecipients);

// مسارات تتطلب صلاحيات مسؤول
router.get('/', requireAdmin, userController.getUsers);
router.get('/:id', requireAdmin, userController.getUserById);
router.post('/', requireAdmin, userController.createUser);
router.put('/:id', requireAdmin, userController.updateUser);
router.delete('/:id', requireAdmin, userController.deleteUser);
router.post('/:id/reset-password', requireAdmin, userController.resetPassword);

module.exports = router;

