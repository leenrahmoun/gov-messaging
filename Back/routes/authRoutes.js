const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Route لإظهار معلومات API (GET)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication API',
    endpoints: {
      login: {
        method: 'POST',
        path: '/api/auth/login',
        description: 'تسجيل الدخول',
        body: {
          username: 'string',
          password: 'string'
        }
      },
      register: {
        method: 'POST',
        path: '/api/auth/register',
        description: 'تسجيل مستخدم جديد',
        body: {
          username: 'string',
          email: 'string',
          password: 'string',
          full_name: 'string',
          role: 'user | manager | admin',
          department: 'string'
        }
      },
      profile: {
        method: 'GET',
        path: '/api/auth/profile',
        description: 'الحصول على الملف الشخصي',
        auth: 'مطلوب (Bearer Token)'
      }
    },
    note: 'استخدم POST request لتسجيل الدخول. يمكنك استخدام صفحة الاختبار: http://localhost:3000'
  });
});

// Routes العامة (بدون مصادقة)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Routes المحمية (تتطلب مصادقة)
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;

