require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const db = require('./db');
const { auditLog } = require('./middleware/audit');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());
app.use(cors());

// Body Parser Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy (للتأكد من الحصول على IP الحقيقي)
app.set('trust proxy', true);

// Health check route (قبل الملفات الثابتة)
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Info route (قبل الملفات الثابتة)
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Gov Messaging API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      messages: '/api/messages',
      attachments: '/api/attachments',
      approvals: '/api/approvals',
      audit: '/api/audit'
    },
    testPage: 'http://localhost:3000 (صفحة الاختبار)',
    healthCheck: 'http://localhost:3000/health'
  });
});

// Serve static files (صفحة الاختبار HTML)
app.use(express.static('public'));

// API Routes (مع Audit Log Middleware)
app.use('/api/auth', auditLog, authRoutes);
app.use('/api/users', auditLog, userRoutes);
app.use('/api/messages', auditLog, messageRoutes);
app.use('/api/attachments', auditLog, attachmentRoutes);
app.use('/api/approvals', auditLog, approvalRoutes);
app.use('/api/audit', auditLog, auditRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'المسار غير موجود'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'حجم الملف كبير جداً'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Other errors
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'حدث خطأ في الخادم',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Server listener removed so tests can import the app without starting a listener.
// Use `start-server.js` to run the application in production/development.
module.exports = app;


