# ✅ حل مشكلة Network Error - الحل النهائي

## المشكلة الحقيقية
الرسالة: "المستخدم غير موجود أو كلمة المرور غير صحيحة"

هذا يعني:
- ✅ Backend يعمل بشكل صحيح
- ✅ الاتصال يعمل
- ❌ المستخدم `admin@example.com` غير موجود في قاعدة البيانات

---

## الحل: إنشاء المستخدم أولاً

### الطريقة 1: استخدام Postman (الأسهل)

1. **افتح Postman**

2. **أنشئ Request جديد:**
   - اضغط **New** → **HTTP Request**

3. **إعداد Register Request:**
   - **Method**: اختر **POST**
   - **URL**: `http://localhost:3000/api/auth/register`
   - **Headers**: 
     - Key: `Content-Type`
     - Value: `application/json`
   - **Body**: 
     - اختر **raw**
     - اختر **JSON**
     - أدخل:
     ```json
     {
       "email": "admin@example.com",
       "password": "admin123",
       "name": "Admin User",
       "role": "admin"
     }
     ```

4. **اضغط Send**

5. **النتيجة المتوقعة:**
   ```json
   {
     "message": "User registered successfully",
     "user": {
       "id": 1,
       "email": "admin@example.com",
       "name": "Admin User",
       "role": "admin"
     }
   }
   ```

6. **الآن سجّل الدخول في Frontend:**
   - Email: `admin@example.com`
   - Password: `admin123`

---

### الطريقة 2: استخدام PowerShell

افتح PowerShell واكتب:

```powershell
$body = @{
    email = "admin@example.com"
    password = "admin123"
    name = "Admin User"
    role = "admin"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -Body $body -ContentType "application/json"
```

**النتيجة:** ستحصل على رد يؤكد إنشاء المستخدم ✅

---

### الطريقة 3: استخدام Script في Backend

في مجلد Backend:

```bash
cd ../gov-messaging
npm run create-admin
```

---

## بعد إنشاء المستخدم

1. **افتح Frontend:**
   - `http://localhost:5176/login` (أو أي منفذ يظهر)

2. **أدخل البيانات:**
   - **Email**: `admin@example.com`
   - **Password**: `admin123`

3. **اضغط Login**

---

## ملخص الخطوات

1. ✅ Backend يعمل على `http://localhost:3000`
2. ✅ Frontend يعمل على `http://localhost:5176`
3. ✅ أنشئ مستخدم عبر Postman أو PowerShell
4. ✅ سجّل الدخول في Frontend

---

## بيانات تسجيل الدخول (بعد الإنشاء)

- **Email**: `admin@example.com`
- **Password**: `admin123`

---

**الآن جرب تسجيل الدخول مرة أخرى! 🎉**

