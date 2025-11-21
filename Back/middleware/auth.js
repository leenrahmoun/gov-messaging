const jwt = require('jsonwebtoken');
const db = require('../db');

const ROLE_ALIASES = {
  user: 'employee'
};

const normalizeRole = (role) => ROLE_ALIASES[role] || role;

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userResult = await db.query(
      `SELECT
         u.id,
         u.username,
         u.email,
         u.full_name,
         u.role,
         u.department_id,
         u.status,
         u.is_active,
         d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (!userResult.rows.length) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    if (!user.is_active || user.status === 'inactive') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is disabled'
      });
    }

    req.user = {
      ...user,
      role: normalizeRole(user.role)
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid authentication token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        success: false, 
        message: 'Authentication token expired'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication failed',
      error: error.message 
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin role required'
    });
  }
  next();
};

const requireManager = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ 
      success: false, 
      message: 'Manager or admin role required'
    });
  }
  next();
};

const authorizeRole = (roles = []) => (req, res, next) => {
  if (!roles.length) {
    return next();
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireManager,
  authorizeRole
};
