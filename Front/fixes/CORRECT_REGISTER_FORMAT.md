# ✅ الحل الصحيح - تنسيق Register

## 🔍 المشكلة الحقيقية

Backend يطلب حقول مختلفة عن ما كنا نستخدمه!

## ✅ الحقول المطلوبة (من Backend):

```javascript
{
  "username": "string",      // ⚠️ مطلوب
  "email": "string",         // ⚠️ مطلوب
  "password": "string",      // ⚠️ مطلوب
  "full_name": "string",     // ⚠️ مطلوب (وليس "name")
  "role": "user|manager|admin",  // اختياري (افتراضي: user)
  "department": "string"     // اختياري
}
```

---

## 📝 الطريقة الصحيحة في Postman

### الخطوة 1: إعداد Request

1. **Method**: **POST**
2. **URL**: `http://localhost:3000/api/auth/register`

### الخطوة 2: Headers

- **Key**: `Content-Type`
- **Value**: `application/json`
- ✅ تأكد من تفعيله (checkbox)

### الخطوة 3: Body

1. اختر **raw**
2. اختر **JSON**
3. أدخل **بالضبط**:

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "test123",
  "full_name": "Test User"
}
```

---

## ✅ أمثلة صحيحة

### مثال 1: مستخدم عادي
```json
{
  "username": "user1",
  "email": "user@example.com",
  "password": "user123",
  "full_name": "Normal User"
}
```

### مثال 2: مستخدم Admin
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "admin123",
  "full_name": "Admin User",
  "role": "admin"
}
```

### مثال 3: مستخدم Manager
```json
{
  "username": "manager1",
  "email": "manager@example.com",
  "password": "manager123",
  "full_name": "Manager User",
  "role": "manager",
  "department": "IT"
}
```

---

## ❌ الأخطاء الشائعة

### خطأ 1: استخدام "name" بدلاً من "full_name"
```json
❌ {
  "email": "test@example.com",
  "password": "test123",
  "name": "Test User"  // خطأ!
}
```

```json
✅ {
  "username": "testuser",
  "email": "test@example.com",
  "password": "test123",
  "full_name": "Test User"  // صحيح!
}
```

### خطأ 2: نسيان "username"
```json
❌ {
  "email": "test@example.com",
  "password": "test123",
  "full_name": "Test User"
  // ناقص username!
}
```

```json
✅ {
  "username": "testuser",  // مطلوب!
  "email": "test@example.com",
  "password": "test123",
  "full_name": "Test User"
}
```

---

## 🎯 الحل السريع (Copy & Paste)

### في Postman:

**URL:**
```
http://localhost:3000/api/auth/register
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw → JSON):**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "test123",
  "full_name": "Test User"
}
```

---

## 🔐 تسجيل الدخول بعد الإنشاء

### في Postman (Login):

**URL:**
```
http://localhost:3000/api/auth/login
```

**Body (raw → JSON):**
```json
{
  "username": "testuser",
  "password": "test123"
}
```

**أو:**
```json
{
  "username": "test@example.com",
  "password": "test123"
}
```

(يمكن استخدام username أو email في تسجيل الدخول)

---

## ✅ في Frontend

بعد إنشاء المستخدم، استخدم:

- **Email**: `test@example.com` (أو username: `testuser`)
- **Password**: `test123`

---

## 📋 ملخص الحقول

| الحقل | مطلوب | النوع | مثال |
|------|------|------|------|
| `username` | ✅ نعم | string | "testuser" |
| `email` | ✅ نعم | string | "test@example.com" |
| `password` | ✅ نعم | string | "test123" (6+ أحرف) |
| `full_name` | ✅ نعم | string | "Test User" |
| `role` | ❌ لا | string | "user", "manager", "admin" |
| `department` | ❌ لا | string | "IT" |

---

**الآن جرب مع الحقول الصحيحة! 🎉**

