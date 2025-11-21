const bcrypt = require('bcryptjs');
const db = require('../db');

const ROLE_ALIASES = {
  user: 'employee'
};

const normalizeRole = (role) => ROLE_ALIASES[role] || role;

const fetchDepartmentById = async (client, departmentId) => {
  if (!departmentId) {
    return null;
  }
  const result = await client.query(
    `SELECT id, name, manager_id FROM departments WHERE id = $1`,
    [departmentId]
  );
  return result.rows[0] || null;
};

const findDepartmentByName = async (client, name) => {
  if (!name) {
    return null;
  }
  const result = await client.query(
    `SELECT id, name, manager_id FROM departments WHERE LOWER(name) = LOWER($1)`,
    [name]
  );
  return result.rows[0] || null;
};

const resolveDepartment = async (client, { departmentId, departmentName }) => {
  if (departmentId) {
    const department = await fetchDepartmentById(client, departmentId);
    if (!department) {
      const error = new Error('Department not found');
      error.statusCode = 404;
      throw error;
    }
    return department;
  }

  if (departmentName && departmentName.trim().length) {
    const existing = await findDepartmentByName(client, departmentName.trim());
    if (existing) {
      return existing;
    }

    const insertResult = await client.query(
      `INSERT INTO departments (name) VALUES ($1) RETURNING id, name, manager_id`,
      [departmentName.trim()]
    );
    return insertResult.rows[0];
  }

  return null;
};

/**
 * الحصول على قائمة المستخدمين
 */
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, department, is_active } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.role,
        u.department_id,
        u.department,
        u.status,
        u.is_active,
        u.created_at,
        u.updated_at,
        d.name AS department_name
      FROM users u
      LEFT JOIN departments d ON d.id = u.department_id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    // إضافة فلاتر
    if (role) {
      query += ` AND role = $${paramCount++}`;
      values.push(role);
    }

    const departmentIdFilter = req.query.department_id || req.query.departmentId;

    if (departmentIdFilter) {
      query += ` AND u.department_id = $${paramCount++}`;
      values.push(parseInt(departmentIdFilter, 10));
    } else if (department) {
      query += ` AND d.name = $${paramCount++}`;
      values.push(department);
    }

    if (is_active !== undefined) {
      query += ` AND u.is_active = $${paramCount++}`;
      values.push(is_active === 'true');
    }

    // إضافة ترتيب وحدود
    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, values);

    // الحصول على العدد الإجمالي
    let countQuery = `
      SELECT COUNT(*)
      FROM users u
      LEFT JOIN departments d ON d.id = u.department_id
      WHERE 1=1
    `;
    const countValues = [];
    paramCount = 1;

    if (role) {
      countQuery += ` AND role = $${paramCount++}`;
      countValues.push(role);
    }

    if (departmentIdFilter) {
      countQuery += ` AND u.department_id = $${paramCount++}`;
      countValues.push(parseInt(departmentIdFilter, 10));
    } else if (department) {
      countQuery += ` AND d.name = $${paramCount++}`;
      countValues.push(department);
    }

    if (is_active !== undefined) {
      countQuery += ` AND u.is_active = $${paramCount++}`;
      countValues.push(is_active === 'true');
    }

    const countResult = await db.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);

    const users = result.rows.map((row) => ({
      ...row,
      role: normalizeRole(row.role),
      department_name: row.department_name || row.department || null
    }));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('خطأ في جلب المستخدمين:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المستخدمين',
      error: error.message
    });
  }
};

/**
 * الحصول على مستخدم محدد
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT
         u.id,
         u.username,
         u.email,
         u.full_name,
         u.role,
         u.department_id,
         u.department,
         u.status,
         u.is_active,
         u.created_at,
         u.updated_at,
         d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.id = $1`,
      [id]
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
          role: normalizeRole(user.role),
          department_name: user.department_name || user.department || null
        }
      }
    });
  } catch (error) {
    console.error('خطأ في جلب المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المستخدم',
      error: error.message
    });
  }
};

/**
 * إنشاء مستخدم جديد (Admin فقط)
 */
const createUser = async (req, res) => {
  const {
    username,
    email,
    password,
    full_name,
    role,
    department,
    department_id,
    departmentId,
    status,
    is_active
  } = req.body;

  try {
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'الرجاء إدخال جميع الحقول المطلوبة'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني غير صحيح'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور يجب أن تكون على الأقل 6 أحرف'
      });
    }

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

    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      const departmentNameInput =
        typeof department === 'string' && department.trim().length
          ? department.trim()
          : null;

      const departmentInfo = await resolveDepartment(client, {
        departmentId: department_id || departmentId,
        departmentName: departmentNameInput
      });

      const passwordHash = await bcrypt.hash(password, 10);
      const normalizedRole = normalizeRole(role || 'employee');
      const userStatus = status || 'active';
      const activeFlag =
        is_active === undefined || is_active === null ? true : Boolean(is_active);

      const insertResult = await client.query(
        `INSERT INTO users (
           username,
           email,
           password_hash,
           full_name,
           role,
           department_id,
           department,
           status,
           is_active
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, username, email, full_name, role, department_id, department, status, is_active, created_at`,
        [
          username,
          email,
          passwordHash,
          full_name,
          normalizedRole,
          departmentInfo ? departmentInfo.id : null,
          departmentInfo ? departmentInfo.name : null,
          userStatus,
          activeFlag
        ]
      );

      const newUser = insertResult.rows[0];

      if (normalizedRole === 'manager' && departmentInfo) {
        await client.query(
          `UPDATE departments SET manager_id = $1 WHERE id = $2`,
          [newUser.id, departmentInfo.id]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'تم إنشاء المستخدم بنجاح',
        data: {
          user: {
            ...newUser,
            role: normalizedRole,
            department_name: departmentInfo ? departmentInfo.name : null
          }
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('خطأ في إنشاء المستخدم:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'خطأ في إنشاء المستخدم',
      error: error.message
    });
  }
};

/**
 * تحديث مستخدم (Admin فقط)
 */
const updateUser = async (req, res) => {
  const {
    username,
    email,
    full_name,
    role,
    department,
    department_id,
    departmentId,
    status,
    is_active
  } = req.body;
  const { id } = req.params;

  try {
    const currentResult = await db.query(
      `SELECT id, role, department_id FROM users WHERE id = $1`,
      [id]
    );

    if (!currentResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    const currentUser = currentResult.rows[0];

    if (username) {
      const usernameCheck = await db.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, id]
      );
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'اسم المستخدم مستخدم بالفعل'
        });
      }
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'البريد الإلكتروني غير صحيح'
        });
      }
      const emailCheck = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'البريد الإلكتروني مستخدم بالفعل'
        });
      }
    }

    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      const departmentIdInput =
        department_id !== undefined ? department_id : departmentId;
      const rawDepartmentName =
        typeof department === 'string' ? department.trim() : department;
      const departmentNameInput =
        typeof rawDepartmentName === 'string' && rawDepartmentName.length
          ? rawDepartmentName
          : null;
      const clearDepartment =
        departmentNameInput === null &&
        (department !== undefined ||
          department_id !== undefined ||
          departmentId !== undefined);

      const departmentInfo = await resolveDepartment(client, {
        departmentId: departmentIdInput,
        departmentName: departmentNameInput
      });

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (username) {
        updates.push(`username = $${paramCount++}`);
        values.push(username);
      }

      if (email) {
        updates.push(`email = $${paramCount++}`);
        values.push(email);
      }

      if (full_name) {
        updates.push(`full_name = $${paramCount++}`);
        values.push(full_name);
      }

      let normalizedRole;
      if (role) {
        normalizedRole = normalizeRole(role);
        updates.push(`role = $${paramCount++}`);
        values.push(normalizedRole);
      }

      if (departmentInfo || clearDepartment) {
        updates.push(`department_id = $${paramCount++}`);
        values.push(departmentInfo ? departmentInfo.id : null);
        updates.push(`department = $${paramCount++}`);
        values.push(departmentInfo ? departmentInfo.name : null);
      }

      if (status) {
        updates.push(`status = $${paramCount++}`);
        values.push(status);
      }

      if (is_active !== undefined) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(Boolean(is_active));
      }

      if (!updates.length) {
        return res.status(400).json({
          success: false,
          message: 'لا توجد بيانات للتحديث'
        });
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const updateResult = await client.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
         RETURNING id, username, email, full_name, role, department_id, department, status, is_active, created_at, updated_at`,
        values
      );

      const updatedUser = updateResult.rows[0];

      const previousRole = normalizeRole(currentUser.role);
      const finalRole = normalizedRole || previousRole;

      if (finalRole === 'manager' && (departmentInfo || updatedUser.department_id)) {
        await client.query(
          `UPDATE departments SET manager_id = $1 WHERE id = $2`,
          [updatedUser.id, departmentInfo ? departmentInfo.id : updatedUser.department_id]
        );
      }

      if (
        previousRole === 'manager' &&
        finalRole !== 'manager'
      ) {
        await client.query(
          `UPDATE departments SET manager_id = NULL WHERE manager_id = $1`,
          [updatedUser.id]
        );
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'تم تحديث المستخدم بنجاح',
        data: {
          user: {
            ...updatedUser,
            role: finalRole,
            department_name: departmentInfo
              ? departmentInfo.name
              : updatedUser.department
          }
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('خطأ في تحديث المستخدم:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'خطأ في تحديث المستخدم',
      error: error.message
    });
  }
};

/**
 * حذف مستخدم (Admin فقط)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await db.query(
      `SELECT id, role, department_id FROM users WHERE id = $1`,
      [id]
    );

    if (!userResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك حذف حسابك الخاص'
      });
    }

    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      const user = userResult.rows[0];
      const normalizedRole = normalizeRole(user.role);

      if (normalizedRole === 'manager') {
        await client.query(
          `UPDATE departments SET manager_id = NULL WHERE manager_id = $1`,
          [user.id]
        );
      }

      await client.query('DELETE FROM users WHERE id = $1', [id]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'تم حذف المستخدم بنجاح'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('خطأ في حذف المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف المستخدم',
      error: error.message
    });
  }
};

/**
 * إعادة تعيين كلمة مرور المستخدم (Admin فقط)
 */
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password) {
      return res.status(400).json({
        success: false,
        message: 'الرجاء إدخال كلمة المرور الجديدة'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور يجب أن تكون على الأقل 6 أحرف'
      });
    }

    // التحقق من وجود المستخدم
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [id]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // تشفير كلمة المرور الجديدة
    const password_hash = await bcrypt.hash(new_password, 10);

    // تحديث كلمة المرور
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, id]);

    res.json({
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح'
    });
  } catch (error) {
    console.error('خطأ في إعادة تعيين كلمة المرور:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إعادة تعيين كلمة المرور',
      error: error.message
    });
  }
};

const listDepartments = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         d.id,
         d.name,
         d.manager_id,
         COALESCE(manager.full_name, '') AS manager_name
       FROM departments d
       LEFT JOIN users manager ON manager.id = d.manager_id
       ORDER BY d.name ASC`
    );

    res.json({
      success: true,
      data: {
        departments: result.rows
      }
    });
  } catch (error) {
    console.error('خطأ في جلب الأقسام:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الأقسام',
      error: error.message
    });
  }
};

/**
 * الحصول على قائمة المستقبلين بناءً على دور المستخدم
 * GET /api/users/recipients
 */
const getRecipients = async (req, res) => {
  try {
    const userId = req.user.id;
    const rawRole = req.user.role;
    const userRole = normalizeRole(rawRole);
    const userDepartmentId = req.user.department_id || null;

    let recipients = [];

    if (userRole === 'admin') {
      // Admin: everyone
      const result = await db.query(
        `SELECT 
           u.id, 
           u.email, 
           u.full_name, 
           u.role,
           u.department_id,
           d.name AS department_name
         FROM users u
         LEFT JOIN departments d ON d.id = u.department_id
         WHERE u.is_active = TRUE
         ORDER BY u.role DESC, u.full_name ASC`
      );
      recipients = result.rows;
    } else if (userRole === 'manager') {
      // Manager recipients:
      // - All employees in manager's department
      // - Managers of other departments
      // - Admins
      const result = await db.query(
        `SELECT 
           u.id, 
           u.email, 
           u.full_name, 
           u.role,
           u.department_id,
           d.name AS department_name
         FROM users u
         LEFT JOIN departments d ON d.id = u.department_id
         WHERE u.is_active = TRUE
         AND (
           u.role = 'admin'
           OR (u.role = 'manager' AND (u.department_id IS DISTINCT FROM $1 OR u.id != $2))
           OR (u.role = 'employee' AND u.department_id = $3)
         )
         ORDER BY u.role DESC, u.full_name ASC`,
        [userDepartmentId, userId, userDepartmentId]
      );

      recipients = result.rows;
    } else {
      // Employee recipients:
      // - Everyone in the same department (employees and managers)
      // - All managers (any department)
      // - Admins
      const result = await db.query(
        `SELECT 
           u.id, 
           u.email, 
           u.full_name, 
           u.role,
           u.department_id,
           d.name AS department_name
         FROM users u
         LEFT JOIN departments d ON d.id = u.department_id
         WHERE u.is_active = TRUE
         AND (
           u.department_id = $1
           OR u.role = 'manager'
           OR u.role = 'admin'
         )
         ORDER BY u.role DESC, u.full_name ASC`,
        [userDepartmentId]
      );

      recipients = result.rows;
    }

    // Remove duplicates (sometimes department match and role match overlap)
    const uniqueById = new Map();
    for (const r of recipients) {
      uniqueById.set(r.id, r);
    }
    const uniqueRecipients = Array.from(uniqueById.values());

    const grouped = {
      admins: uniqueRecipients.filter((r) => r.role === 'admin'),
      managers: uniqueRecipients.filter((r) => r.role === 'manager'),
      employees: uniqueRecipients.filter((r) => r.role === 'employee')
    };

    res.json({
      success: true,
      data: {
        recipients: uniqueRecipients,
        grouped
      }
    });
  } catch (error) {
    console.error('خطأ في جلب المستقبلين:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المستقبلين',
      error: error.message
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  listDepartments,
  getRecipients
};

