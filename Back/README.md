# نظام إدارة المراسلات الحكومية الرقمية
## Gov Messaging System

نظام إدارة مراسلات حكومية رقمية كامل مبني باستخدام Node.js + Express + PostgreSQL.

## 📋 المحتويات

- [المميزات](#المميزات)
- [المتطلبات](#المتطلبات)
- [التثبيت](#التثبيت)
- [التهيئة](#التهيئة)
- [التشغيل](#التشغيل)
- [API Documentation](#api-documentation)
- [الهيكل](#هيكل-المشروع)
- [الأمان](#الأمان)
- [المساهمة](#المساهمة)

## ✨ المميزات

- ✅ إدارة المستخدمين مع نظام صلاحيات (Admin, Manager, User)
- ✅ إدارة المراسلات مع دعم أنواع متعددة (داخلي، خارجي، رسمي)
- ✅ نظام الموافقات على المراسلات
- ✅ رفع وإدارة المرفقات
- ✅ تسجيل جميع الأحداث في Audit Log
- ✅ حماية API باستخدام JWT
- ✅ تشفير كلمات المرور باستخدام bcrypt
- ✅ دعم المستلمين الداخليين والخارجيين
- ✅ نظام أولويات للمراسلات
- ✅ نظام حالات متقدم للمراسلات

## 🔧 المتطلبات

- Node.js (الإصدار 14 أو أحدث)
- PostgreSQL (الإصدار 12 أو أحدث)
- npm أو yarn

## 📦 التثبيت

### 1. استنساخ المشروع

```bash
git clone <repository-url>
cd gov-messaging
```

### 2. تثبيت الحزم

```bash
npm install
```

### 3. إعداد قاعدة البيانات

تأكد من تشغيل PostgreSQL على نظامك، ثم قم بإنشاء قاعدة بيانات جديدة:

```sql
CREATE DATABASE gov_messaging;
```

### 4. إعداد ملف البيئة

انسخ ملف `env.example` إلى `.env` وقم بتعديل القيم:

```bash
cp env.example .env
```

قم بتعديل ملف `.env`:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/gov_messaging

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Admin User Configuration (لإنشاء مستخدم المسؤول الأول)
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@gov.ma
ADMIN_PASSWORD=admin123
ADMIN_FULL_NAME=مدير النظام
ADMIN_DEPARTMENT=إدارة تقنية المعلومات
```

## 🚀 التهيئة

### 1. تهيئة قاعدة البيانات

قم بإنشاء الجداول والفهارس:

```bash
npm run init-db
```

### 2. إنشاء مستخدم المسؤول الأول

```bash
npm run create-admin
```

سيتم إنشاء مستخدم مسؤول بالبيانات المحددة في ملف `.env`.

**⚠️ مهم:** غير كلمة المرور بعد أول تسجيل دخول!

## 🎯 التشغيل

### وضع التطوير

```bash
npm run dev
```

أو

```bash
npm start
```

سيتم تشغيل الخادم على `http://localhost:3000`

### التحقق من الحالة

افتح المتصفح وانتقل إلى:

```
http://localhost:3000/health
```

يجب أن ترى:

```json
{
  "success": true,
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

جميع الطلبات تتطلب JWT Token في Header (ما عدا تسجيل الدخول والتسجيل):

```
Authorization: Bearer <token>
```

### Endpoints

#### 🔐 Authentication (`/api/auth`)

##### تسجيل مستخدم جديد
```
POST /api/auth/register
Body: {
  "username": "string",
  "email": "string",
  "password": "string",
  "full_name": "string",
  "role": "user" | "manager" | "admin",
  "department": "string"
}
```

##### تسجيل الدخول
```
POST /api/auth/login
Body: {
  "username": "string",
  "password": "string"
}
Response: {
  "success": true,
  "data": {
    "user": {...},
    "token": "jwt-token"
  }
}
```

##### الحصول على الملف الشخصي
```
GET /api/auth/profile
Headers: Authorization: Bearer <token>
```

##### تحديث الملف الشخصي
```
PUT /api/auth/profile
Headers: Authorization: Bearer <token>
Body: {
  "full_name": "string",
  "email": "string",
  "department": "string"
}
```

##### تغيير كلمة المرور
```
POST /api/auth/change-password
Headers: Authorization: Bearer <token>
Body: {
  "old_password": "string",
  "new_password": "string"
}
```

#### 👥 Users (`/api/users`)

##### الحصول على قائمة المستخدمين
```
GET /api/users?page=1&limit=10&role=admin&department=IT
Headers: Authorization: Bearer <token>
```

##### الحصول على مستخدم محدد
```
GET /api/users/:id
Headers: Authorization: Bearer <token>
```

##### إنشاء مستخدم جديد (Admin فقط)
```
POST /api/users
Headers: Authorization: Bearer <token>
Body: {
  "username": "string",
  "email": "string",
  "password": "string",
  "full_name": "string",
  "role": "user" | "manager" | "admin",
  "department": "string",
  "is_active": true
}
```

##### تحديث مستخدم (Admin فقط)
```
PUT /api/users/:id
Headers: Authorization: Bearer <token>
Body: {
  "username": "string",
  "email": "string",
  "full_name": "string",
  "role": "user" | "manager" | "admin",
  "department": "string",
  "is_active": true
}
```

##### حذف مستخدم (Admin فقط)
```
DELETE /api/users/:id
Headers: Authorization: Bearer <token>
```

##### إعادة تعيين كلمة مرور (Admin فقط)
```
POST /api/users/:id/reset-password
Headers: Authorization: Bearer <token>
Body: {
  "new_password": "string"
}
```

#### 📨 Messages (`/api/messages`)

##### الحصول على قائمة المراسلات
```
GET /api/messages?page=1&limit=10&status=sent&message_type=internal&priority=high
Headers: Authorization: Bearer <token>
```

##### الحصول على مراسلة محددة
```
GET /api/messages/:id
Headers: Authorization: Bearer <token>
```

##### إنشاء مراسلة جديدة
```
POST /api/messages
Headers: Authorization: Bearer <token>
Body: {
  "subject": "string",
  "content": "string",
  "message_type": "internal" | "external" | "official",
  "priority": "low" | "normal" | "high" | "urgent",
  "requires_approval": true,
  "recipient_ids": [1, 2, 3],
  "recipient_emails": ["email@example.com"]
}
```

##### تحديث مراسلة
```
PUT /api/messages/:id
Headers: Authorization: Bearer <token>
Body: {
  "subject": "string",
  "content": "string",
  "message_type": "internal" | "external" | "official",
  "priority": "low" | "normal" | "high" | "urgent"
}
```

##### حذف مراسلة
```
DELETE /api/messages/:id
Headers: Authorization: Bearer <token>
```

##### إرسال مراسلة
```
POST /api/messages/:id/send
Headers: Authorization: Bearer <token>
```

#### 📎 Attachments (`/api/attachments`)

##### رفع مرفق لمراسلة
```
POST /api/attachments/:messageId/upload
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
Body: {
  "file": File
}
```

##### الحصول على قائمة المرفقات
```
GET /api/attachments/:messageId
Headers: Authorization: Bearer <token>
```

##### تحميل مرفق
```
GET /api/attachments/download/:id
Headers: Authorization: Bearer <token>
```

##### حذف مرفق
```
DELETE /api/attachments/:id
Headers: Authorization: Bearer <token>
```

#### ✅ Approvals (`/api/approvals`)

##### الحصول على قائمة الموافقات
```
GET /api/approvals?page=1&limit=10&status=pending
Headers: Authorization: Bearer <token>
```

##### الحصول على موافقة محددة
```
GET /api/approvals/:id
Headers: Authorization: Bearer <token>
```

##### الموافقة على مراسلة
```
POST /api/approvals/:id/approve
Headers: Authorization: Bearer <token>
Body: {
  "comments": "string"
}
```

##### رفض مراسلة
```
POST /api/approvals/:id/reject
Headers: Authorization: Bearer <token>
Body: {
  "comments": "string" (مطلوب)
}
```

#### 📊 Audit Logs (`/api/audit`)

##### الحصول على سجل الأحداث
```
GET /api/audit?page=1&limit=50&user_id=1&entity_type=message&start_date=2024-01-01&end_date=2024-12-31
Headers: Authorization: Bearer <token>
(Manager و Admin فقط)
```

##### الحصول على إحصائيات سجل الأحداث
```
GET /api/audit/stats
Headers: Authorization: Bearer <token>
(Manager و Admin فقط)
```

## 📁 هيكل المشروع

```
gov-messaging/
├── controllers/          # Controllers للوظائف
│   ├── authController.js
│   ├── userController.js
│   ├── messageController.js
│   ├── attachmentController.js
│   ├── approvalController.js
│   └── auditController.js
├── routes/              # Routes للـ APIs
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── messageRoutes.js
│   ├── attachmentRoutes.js
│   ├── approvalRoutes.js
│   └── auditRoutes.js
├── middleware/          # Middleware
│   ├── auth.js         # JWT Authentication
│   ├── audit.js        # Audit Logging
│   └── upload.js       # File Upload (Multer)
├── database/           # قاعدة البيانات
│   ├── schema.sql      # SQL Schema
│   └── init.js         # تهيئة قاعدة البيانات
├── db/                 # اتصال قاعدة البيانات
│   └── index.js        # PostgreSQL Connection Pool
├── scripts/            # Scripts مساعدة
│   └── createAdmin.js  # إنشاء مستخدم المسؤول
├── uploads/            # الملفات المرفوعة
├── server.js           # نقطة البداية
├── package.json        # إعدادات المشروع
├── .env               # متغيرات البيئة
└── README.md          # التوثيق
```

## 🔒 الأمان

### الحماية المطبقة

- ✅ JWT Authentication
- ✅ Password Hashing (bcrypt)
- ✅ Role-based Access Control (RBAC)
- ✅ Helmet.js للحد من الثغرات الأمنية
- ✅ CORS Configuration
- ✅ Input Validation
- ✅ SQL Injection Protection (Parameterized Queries)
- ✅ File Upload Security (Type & Size Validation)
- ✅ Audit Logging

### أفضل الممارسات

1. **غير JWT_SECRET** في ملف `.env` في الإنتاج
2. **استخدم HTTPS** في الإنتاج
3. **غير كلمة مرور المسؤول** بعد أول تسجيل دخول
4. **راجع Audit Logs** بانتظام
5. **احفظ ملف `.env`** آمن ولا ترفعه إلى Git

## 🔄 حالات المراسلات

- `draft`: مسودة
- `pending_approval`: في انتظار الموافقة
- `approved`: موافق عليها
- `sent`: مرسلة
- `rejected`: مرفوضة
- `archived`: مؤرشفة

## 🎭 أدوار المستخدمين

- `admin`: مدير النظام - صلاحيات كاملة
- `manager`: مدير - يمكنه الموافقة على المراسلات وإدارة المستخدمين
- `user`: مستخدم عادي - يمكنه إنشاء وقراءة المراسلات الخاصة به

## 📝 ملاحظات مهمة

1. **الملفات المرفوعة** تُحفظ في مجلد `uploads/` محلياً
2. **Audit Logs** تسجل جميع العمليات المهمة
3. **الموافقات** مطلوبة للمراسلات الرسمية والخارجية حسب الإعدادات
4. **المستخدمون العاديون** يرون فقط المراسلات المرسلة إليهم أو المرسلة منهم
5. **المديرون والمسؤولون** يمكنهم رؤية جميع المراسلات

## 🐛 استكشاف الأخطاء

### خطأ الاتصال بقاعدة البيانات

تأكد من:
- تشغيل PostgreSQL
- صحة بيانات الاتصال في `.env`
- وجود قاعدة البيانات `gov_messaging`

### خطأ في JWT

تأكد من:
- إرسال Token في Header: `Authorization: Bearer <token>`
- صلاحية Token (لم تنتهِ)
- صحة `JWT_SECRET` في `.env`

### خطأ في رفع الملفات

تأكد من:
- وجود مجلد `uploads/`
- حجم الملف أقل من `MAX_FILE_SIZE`
- نوع الملف مسموح به (PDF, Word, Excel, Images, Text)

## 🤝 المساهمة

نرحب بالمساهمات! يرجى:

1. Fork المشروع
2. إنشاء Branch جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى Branch (`git push origin feature/AmazingFeature`)
5. فتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة ISC.

## 👨‍💻 الدعم

للأسئلة والدعم، يرجى فتح Issue في المستودع.

## 🔮 التطويرات المستقبلية

- [ ] إضافة نظام إشعارات
- [ ] إضافة نظام بحث متقدم
- [ ] إضافة تصدير البيانات
- [ ] إضافة واجهة مستخدم (Frontend)
- [ ] إضافة نظام نسخ احتياطي تلقائي
- [ ] إضافة نظام تقارير متقدم

---

**تم البناء بـ ❤️ باستخدام Node.js + Express + PostgreSQL**

