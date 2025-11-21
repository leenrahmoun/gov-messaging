# 🚀 طريقة بسيطة لإنشاء مستخدم وتسجيل الدخول

## الطريقة الأسهل (بدون Postman)

### الخطوة 1: تأكد من أن Backend يعمل

افتح Terminal جديد واختبر:

```bash
curl http://localhost:3000
```

إذا رأيت رد، Backend يعمل ✅

---

### الخطوة 2: إنشاء مستخدم جديد (PowerShell)

افتح PowerShell واكتب:

```powershell
$body = @{
    email = "test@example.com"
    password = "test123"
    name = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -Body $body -ContentType "application/json"
```

**النتيجة:** ستحصل على رد يؤكد إنشاء المستخدم ✅

---

### الخطوة 3: تسجيل الدخول في Frontend

1. افتح: `http://localhost:5176/login` (أو أي منفذ يظهر)
2. أدخل:
   - **Email**: `test@example.com`
   - **Password**: `test123`
3. اضغط **Login**

---

## أو استخدم Postman (الأسهل للمبتدئين)

### 1. افتح Postman

### 2. أنشئ Request جديد:
- اضغط **New** → **HTTP Request**

### 3. إعداد الطلب:

**الطريقة:**
- اختر **POST** من القائمة

**الرابط:**
```
http://localhost:3000/api/auth/register
```

**Headers:**
- اضغط تبويب **Headers**
- أضف:
  - Key: `Content-Type`
  - Value: `application/json`

**Body:**
- اضغط تبويب **Body**
- اختر **raw**
- اختر **JSON** من القائمة
- أدخل:
```json
{
  "email": "test@example.com",
  "password": "test123",
  "name": "Test User"
}
```

### 4. اضغط Send

### 5. استخدم البيانات في Frontend:
- Email: `test@example.com`
- Password: `test123`

---

## 🎯 الخطوات السريعة (ملخص)

1. ✅ Backend يعمل على `http://localhost:3000`
2. ✅ Frontend يعمل على `http://localhost:5176`
3. ✅ أنشئ مستخدم عبر Postman أو PowerShell
4. ✅ سجّل الدخول في Frontend بالبيانات

---

**جاهز! 🎉**

