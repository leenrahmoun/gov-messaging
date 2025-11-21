const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const ROLE_ALIASES = {
  user: 'employee',
};

const normalizeRole = (role) => ROLE_ALIASES[role] || role;

/**
 * تسجيل مستخدم جديد
 */
const register = async (req, res) => {
  try {
    const { username, email, password, full_name, role, department } = req.body;

    // التحقق من البيانات المطلوبة
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'الرجاء إدخال جميع الحقول المطلوبة'
      });
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني غير صحيح'
      });
    }

    // التحقق من قوة كلمة المرور
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور يجب أن تكون على الأقل 6 أحرف'
      });
    }

    // التحقق من وجود المستخدم
    const existingUser = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل'
      });
    }

    // تشفير كلمة المرور
    const password_hash = await bcrypt.hash(password, 10);

    // إدراج المستخدم الجديد
    const normalizedRole = normalizeRole(role || 'employee');

    const result = await db.query(
      `INSERT INTO users (
         username,
         email,
         password_hash,
         full_name,
         role,
         department_id,
         is_active
       )
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, username, email, full_name, role, department_id, is_active, created_at`,
      [username, email, password_hash, full_name, normalizedRole, department || null]
    );

    const user = {
      ...result.rows[0],
      role: normalizedRole,
    };

    res.status(201).json({
      success: true,
      message: 'تم تسجيل المستخدم بنجاح',
      data: { user }
    });
  } catch (error) {
    console.error('خطأ في تسجيل المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل المستخدم',
      error: error.message
    });
  }
};

/**
 * تسجيل الدخول
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // التحقق من البيانات المطلوبة
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'الرجاء إدخال اسم المستخدم وكلمة المرور'
      });
    }

    // البحث عن المستخدم
    const result = await db.query(
      `SELECT
         u.id,
         u.username,
         u.email,
         u.password_hash,
         u.full_name,
         u.role,
         u.department_id,
         u.is_active,
         d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.username = $1 OR u.email = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }

    const user = result.rows[0];

    // التحقق من حالة الحساب
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'الحساب معطل'
      });
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }

    // إنشاء JWT Token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT secret not configured. Set JWT_SECRET in .env');
      return res.status(500).json({
        success: false,
        message: 'خطأ في تسجيل الدخول',
        error: 'Server configuration error: JWT secret not set'
      });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // إزالة كلمة المرور من الاستجابة
    delete user.password_hash;
    user.role = normalizeRole(user.role);

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل الدخول',
      error: error.message
    });
  }
};

/**
 * الحصول على معلومات المستخدم الحالي
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT
         u.id,
         u.username,
         u.email,
         u.full_name,
         u.role,
         u.department_id,
         u.is_active,
         u.created_at,
         u.updated_at,
         d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          ...user,
          role: normalizeRole(user.role)
        }
      }
    });
  } catch (error) {
    console.error('خطأ في جلب معلومات المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب معلومات المستخدم',
      error: error.message
    });
  }
};

/**
 * تحديث معلومات المستخدم الحالي
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, department_id, email } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (full_name) {
      updates.push(`full_name = $${paramCount++}`);
      values.push(full_name);
    }

    if (department_id !== undefined) {
      updates.push(`department_id = $${paramCount++}`);
      values.push(department_id);
    }

    if (email) {
      // التحقق من صحة البريد الإلكتروني
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'البريد الإلكتروني غير صحيح'
        });
      }

      // التحقق من عدم استخدام البريد من قبل مستخدم آخر
      const emailCheck = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'البريد الإلكتروني مستخدم بالفعل'
        });
      }

      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لا توجد بيانات للتحديث'
      });
    }

    values.push(userId);

    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, username, email, full_name, role, department_id, is_active, created_at, updated_at`,
      values
    );

    res.json({
      success: true,
      message: 'تم تحديث معلومات المستخدم بنجاح',
      data: { user: result.rows[0] }
    });
  } catch (error) {
    console.error('خطأ في تحديث معلومات المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث معلومات المستخدم',
      error: error.message
    });
  }
};

/**
 * تغيير كلمة المرور
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'الرجاء إدخال كلمة المرور القديمة والجديدة'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الجديدة يجب أن تكون على الأقل 6 أحرف'
      });
    }

    // جلب كلمة المرور الحالية
    const result = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // التحقق من كلمة المرور القديمة
    const isPasswordValid = await bcrypt.compare(old_password, result.rows[0].password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'كلمة المرور القديمة غير صحيحة'
      });
    }

    // تشفير كلمة المرور الجديدة
    const new_password_hash = await bcrypt.hash(new_password, 10);

    // تحديث كلمة المرور
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [new_password_hash, userId]
    );

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تغيير كلمة المرور:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تغيير كلمة المرور',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};
