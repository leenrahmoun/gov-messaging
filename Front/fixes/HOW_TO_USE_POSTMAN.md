# 📮 دليل استخدام Postman - Gov Messaging System

## 🎯 الهدف
تعلم كيفية استخدام Postman لإنشاء مستخدم جديد والحصول على بيانات تسجيل الدخول.

---

## 📋 الخطوة 1: فتح Postman

1. افتح تطبيق **Postman**
2. سترى واجهة فارغة

---

## 📋 الخطوة 2: إنشاء مستخدم جديد (Register)

### 2.1 إعداد الطلب

1. **اختر نوع الطلب:**
   - اضغط على القائمة المنسدلة (الافتراضي: GET)
   - اختر **POST**

2. **أدخل الرابط:**
   ```
   http://localhost:3000/api/auth/register
   ```

3. **اختر Headers:**
   - اضغط على تبويب **Headers**
   - أضف:
     - **Key**: `Content-Type`
     - **Value**: `application/json`

4. **اختر Body:**
   - اضغط على تبويب **Body**
   - اختر **raw**
   - اختر **JSON** من القائمة المنسدلة
   - أدخل البيانات التالية:

```json
{
  "email": "test@example.com",
  "password": "test123",
  "name": "Test User"
}
```

### 2.2 إرسال الطلب

1. اضغط على زر **Send** (أزرق)
2. انتظر النتيجة

### 2.3 النتيجة المتوقعة

ستحصل على رد مثل:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

**✅ الآن لديك مستخدم جديد!**
- **Email**: `test@example.com`
- **Password**: `test123`

---

## 📋 الخطوة 3: تسجيل الدخول (Login)

### 3.1 إعداد الطلب

1. **أنشئ طلب جديد:**
   - اضغط على **+ New** أو **New Request**

2. **اختر نوع الطلب:**
   - اختر **POST**

3. **أدخل الرابط:**
   ```
   http://localhost:3000/api/auth/login
   ```

4. **اختر Headers:**
   - اضغط على تبويب **Headers**
   - أضف:
     - **Key**: `Content-Type`
     - **Value**: `application/json`

5. **اختر Body:**
   - اضغط على تبويب **Body**
   - اختر **raw**
   - اختر **JSON**
   - أدخل البيانات:

```json
{
  "email": "test@example.com",
  "password": "test123"
}
```

### 3.2 إرسال الطلب

1. اضغط على زر **Send**
2. انتظر النتيجة

### 3.3 النتيجة المتوقعة

ستحصل على رد مثل:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User",
    "role": "user"
  }
}
```

**✅ الآن لديك Token!** (لكن لا تحتاجه للـ Frontend - سيأخذه تلقائياً)

---

## 📋 الخطوة 4: استخدام البيانات في Frontend

بعد إنشاء المستخدم عبر Postman:

1. **افتح Frontend:**
   - افتح `http://localhost:5176/login` (أو أي منفذ يظهر)

2. **أدخل البيانات:**
   - **Email**: `test@example.com`
   - **Password**: `test123`

3. **اضغط Login**

---

## 🎨 صور توضيحية (خطوات Postman)

### إنشاء Request جديد:
```
1. اضغط على "New" أو "+"
2. اختر "HTTP Request"
```

### إعداد POST Request:
```
1. اختر POST من القائمة
2. أدخل: http://localhost:3000/api/auth/register
3. اضغط Headers → أضف Content-Type: application/json
4. اضغط Body → اختر raw → اختر JSON
5. أدخل البيانات JSON
6. اضغط Send
```

---

## 🔧 استكشاف الأخطاء

### المشكلة: "Cannot POST /api/auth/register"

**الحل:**
- تأكد من أن Backend يعمل على `http://localhost:3000`
- تحقق من الرابط: يجب أن يكون `/api/auth/register` وليس `/auth/register`

### المشكلة: "Network Error"

**الحل:**
- تأكد من أن Backend يعمل
- افتح `http://localhost:3000` في المتصفح للتأكد

### المشكلة: "User already exists"

**الحل:**
- المستخدم موجود بالفعل
- استخدم بياناته الموجودة أو أنشئ مستخدم جديد ببريد مختلف

---

## 📝 أمثلة سريعة

### مثال 1: إنشاء مستخدم Admin
```json
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123",
  "name": "Admin User",
  "role": "admin"
}
```

### مثال 2: إنشاء مستخدم عادي
```json
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "user123",
  "name": "Normal User"
}
```

### مثال 3: تسجيل الدخول
```json
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "user123"
}
```

---

## ✅ خطوات سريعة (ملخص)

1. **افتح Postman**
2. **أنشئ POST Request:**
   - URL: `http://localhost:3000/api/auth/register`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "email": "test@example.com",
       "password": "test123",
       "name": "Test User"
     }
     ```
3. **اضغط Send**
4. **استخدم البيانات في Frontend:**
   - Email: `test@example.com`
   - Password: `test123`

---

**جاهز! الآن يمكنك تسجيل الدخول في Frontend 🎉**

