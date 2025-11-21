# دليل حل المشاكل
## Troubleshooting Guide

## 🔴 خطأ: password authentication failed for user "postgres"

### المشكلة:
```
error: password authentication failed for user "postgres"
code: '28P01'
```

### الحلول:

#### الحل 1: التحقق من كلمة المرور الصحيحة

1. **افتح pgAdmin** أو **psql** من Command Line
2. جرب تسجيل الدخول باستخدام كلمة المرور التي تعرفها
3. إذا نجحت، استخدم نفس كلمة المرور في ملف `.env`

#### الحل 2: إعادة تعيين كلمة المرور

##### على Windows:

1. افتح **Command Prompt** كمسؤول (Run as Administrator)

2. أوقف خدمة PostgreSQL:
```bash
net stop postgresql-x64-14
```
(استبدل `14` برقم إصدار PostgreSQL الخاص بك)

3. ابحث عن ملف `pg_hba.conf`:
   - المسار الافتراضي: `C:\Program Files\PostgreSQL\14\data\pg_hba.conf`
   - أو استخدم البحث في Windows

4. افتح الملف وعدل السطر:
   ```
   # FROM
   host    all             all             127.0.0.1/32            scram-sha-256
   
   # TO
   host    all             all             127.0.0.1/32            trust
   ```

5. احفظ الملف وأعد تشغيل PostgreSQL:
```bash
net start postgresql-x64-14
```

6. الآن يمكنك الدخول بدون كلمة مرور:
```bash
psql -U postgres
```

7. غير كلمة المرور:
```sql
ALTER USER postgres WITH PASSWORD 'your_new_password';
```

8. ارجع إلى ملف `pg_hba.conf` وارجع الإعدادات إلى `scram-sha-256`

9. أعد تشغيل PostgreSQL مرة أخرى

#### الحل 3: استخدام مستخدم مختلف

إذا كان لديك مستخدم آخر في PostgreSQL:

1. افتح `psql`:
```bash
psql -U your_username -d postgres
```

2. أنشئ قاعدة البيانات:
```sql
CREATE DATABASE gov_messaging;
```

3. عدل ملف `.env`:
```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/gov_messaging
```

#### الحل 4: التحقق من حالة PostgreSQL

1. **تحقق من تشغيل PostgreSQL:**
```bash
# على Windows
sc query postgresql-x64-14
```

2. **إذا لم يكن يعمل، شغله:**
```bash
net start postgresql-x64-14
```

#### الحل 5: استخدام Trust Authentication (للتطوير فقط)

⚠️ **تحذير:** هذا الحل فقط للتطوير المحلي، لا تستخدمه في الإنتاج!

1. افتح `pg_hba.conf`

2. غيّر جميع الأسطر إلى `trust`:
   ```
   host    all             all             127.0.0.1/32            trust
   local   all             all                                     trust
   ```

3. أعد تشغيل PostgreSQL

4. عدل ملف `.env` (بدون كلمة مرور):
```env
DATABASE_URL=postgresql://postgres@localhost:5432/gov_messaging
```

## 🔴 خطأ: database "gov_messaging" does not exist

### الحل:

1. افتح `psql`:
```bash
psql -U postgres
```

2. أنشئ قاعدة البيانات:
```sql
CREATE DATABASE gov_messaging;
```

3. تحقق من إنشائها:
```sql
\l
```

## 🔴 خطأ: connection refused

### الحل:

1. **تحقق من تشغيل PostgreSQL:**
```bash
net start postgresql-x64-14
```

2. **تحقق من المنفذ (افتراضي 5432):**
```bash
netstat -an | findstr 5432
```

3. **إذا كان المنفذ مختلف، عدل ملف `.env`:**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5433/gov_messaging
```

## 🔴 خطأ: JWT Secret is not defined

### الحل:

1. تأكد من وجود ملف `.env`
2. تأكد من وجود `JWT_SECRET` في `.env`
3. أعد تشغيل الخادم

## 📝 خطوات التحقق السريعة

### 1. التحقق من ملف `.env`:

تأكد من أن ملف `.env` يحتوي على:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/gov_messaging
```

### 2. اختبار الاتصال بقاعدة البيانات:

أنشئ ملف `test-db.js`:
```javascript
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ خطأ في الاتصال:', err.message);
  } else {
    console.log('✅ الاتصال ناجح!', res.rows[0]);
  }
  pool.end();
});
```

شغله:
```bash
node test-db.js
```

### 3. التحقق من PostgreSQL:

```bash
# التحقق من الإصدار
psql --version

# محاولة الاتصال
psql -U postgres -d postgres
```

## 🆘 إذا لم تحل المشكلة

1. تحقق من ملف `pg_hba.conf`
2. تحقق من ملف `postgresql.conf`
3. راجع سجلات PostgreSQL
4. تأكد من تثبيت PostgreSQL بشكل صحيح

## 📞 المساعدة الإضافية

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Windows Installation Guide](https://www.postgresql.org/download/windows/)

---

**تم البناء بـ ❤️**

