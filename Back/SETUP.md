# دليل الإعداد السريع
## Quick Setup Guide

## خطوات الإعداد السريعة

### 1. تثبيت PostgreSQL

#### على Windows:
- قم بتحميل PostgreSQL من [الموقع الرسمي](https://www.postgresql.org/download/windows/)
- قم بتثبيته واتبع التعليمات
- تذكر كلمة مرور المستخدم `postgres`

#### إنشاء قاعدة البيانات:
```sql
-- افتح psql أو pgAdmin
CREATE DATABASE gov_messaging;
```

### 2. تثبيت الحزم

```bash
npm install
```

### 3. إعداد ملف البيئة

```bash
# نسخ ملف env.example إلى .env
copy env.example .env
```

ثم قم بتعديل ملف `.env`:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/gov_messaging
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**⚠️ مهم:** 
- استبدل `your_password` بكلمة المرور الصحيحة لـ PostgreSQL
- إذا لم تكن تعرف كلمة المرور، راجع ملف `TROUBLESHOOTING.md`

### 3.1. اختبار الاتصال بقاعدة البيانات (اختياري لكن موصى به)

```bash
npm run test-db
```

سيتم اختبار الاتصال وإعطائك معلومات مفيدة إذا كان هناك خطأ.

### 4. تهيئة قاعدة البيانات

```bash
npm run init-db
```

سيتم إنشاء جميع الجداول والفهارس والـ Triggers.

### 5. إنشاء مستخدم المسؤول

```bash
npm run create-admin
```

سيتم إنشاء مستخدم مسؤول بالبيانات المحددة في `.env`.

**معلومات تسجيل الدخول الافتراضية:**
- اسم المستخدم: `admin`
- كلمة المرور: `admin123`

**⚠️ مهم:** غير كلمة المرور بعد أول تسجيل دخول!

### 6. تشغيل الخادم

```bash
npm start
```

أو

```bash
npm run dev
```

### 7. التحقق من التشغيل

افتح المتصفح وانتقل إلى:
- `http://localhost:3000` - الصفحة الرئيسية
- `http://localhost:3000/health` - فحص الحالة

## تسجيل الدخول الأول

### استخدام Postman أو أي أداة HTTP:

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

ستحصل على Token في الاستجابة:

```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### استخدام Token في الطلبات التالية:

```
Authorization: Bearer <your-token>
```

## اختبار API

### إنشاء مراسلة:

```bash
POST http://localhost:3000/api/messages
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "subject": "اختبار المراسلة",
  "content": "هذا محتوى المراسلة",
  "message_type": "internal",
  "priority": "normal",
  "recipient_ids": [2]
}
```

## استكشاف الأخطاء

### خطأ: "password authentication failed for user postgres"

**الحل السريع:**
1. تحقق من كلمة المرور في ملف `.env`
2. جرب تسجيل الدخول إلى PostgreSQL باستخدام:
   ```bash
   psql -U postgres
   ```
3. إذا نجحت، استخدم نفس كلمة المرور في `.env`
4. راجع ملف `TROUBLESHOOTING.md` للحلول التفصيلية

### خطأ: "Cannot connect to database"

**الحل:**
1. تأكد من تشغيل PostgreSQL
2. تحقق من صحة `DATABASE_URL` في `.env`
3. تأكد من وجود قاعدة البيانات `gov_messaging`
4. جرب تشغيل: `npm run test-db` للحصول على معلومات مفصلة

### خطأ: "JWT Secret is not defined"

**الحل:**
1. تأكد من وجود ملف `.env`
2. تأكد من وجود `JWT_SECRET` في `.env`

### خطأ: "Port 3000 is already in use"

**الحل:**
1. غير `PORT` في `.env`
2. أو أوقف التطبيق الذي يستخدم المنفذ 3000

## الخطوات التالية

1. ✅ غير كلمة مرور المسؤول
2. ✅ أنشئ مستخدمين جدد
3. ✅ ابدأ بإنشاء المراسلات
4. ✅ راجع Audit Logs

## المساعدة

إذا واجهت أي مشاكل، راجع ملف `README.md` للحصول على توثيق كامل.

---

**تم البناء بـ ❤️**

