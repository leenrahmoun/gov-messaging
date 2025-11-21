const multer = require('multer');
const path = require('path');
const fs = require('fs');

// إنشاء مجلد التحميل إذا لم يكن موجوداً
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// إعداد Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // إنشاء مجلد لكل رسالة أو استخدام مجلد عام
    const messageId = req.body.messageId || req.params.messageId || 'general';
    const messageDir = path.join(uploadDir, `message_${messageId}`);
    
    if (!fs.existsSync(messageDir)) {
      fs.mkdirSync(messageDir, { recursive: true });
    }
    
    cb(null, messageDir);
  },
  filename: (req, file, cb) => {
    // إنشاء اسم ملف فريد: timestamp_originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${name}_${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// فلتر الملفات المسموح بها
const fileFilter = (req, file, cb) => {
  // أنواع الملفات المسموح بها
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مسموح به. الأنواع المسموح بها: PDF, Word, Excel, Images, Text'), false);
  }
};

// إعداد Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB افتراضي
  },
  fileFilter: fileFilter
});

module.exports = upload;

