# كيفية اختبار API
## How to Test the API

## 🔍 المشكلة

عند فتح `http://localhost:3000/api/auth/login` في المتصفح، تحصل على:
```json
{"success":false,"message":"المسار غير موجود"}
```

## ✅ السبب

المشكلة هي أن `/api/auth/login` هو **POST endpoint** وليس GET. المتصفح يرسل **GET requests** فقط عند فتح URL مباشرة.

## 🛠️ الحلول

### الحل 1: استخدام صفحة الاختبار (الأسهل) ✨

تم إنشاء صفحة HTML بسيطة لاختبار API:

1. **شغّل الخادم:**
   ```bash
   npm start
   ```

2. **افتح المتصفح وانتقل إلى:**
   ```
   http://localhost:3000
   ```

3. **ستظهر صفحة اختبار** حيث يمكنك:
   - تسجيل الدخول
   - رؤية النتائج
   - حفظ Token تلقائياً

### الحل 2: استخدام Postman

1. **حمّل Postman** من [postman.com](https://www.postman.com/downloads/)

2. **أنشئ Request جديد:**
   - Method: **POST**
   - URL: `http://localhost:3000/api/auth/login`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "username": "admin",
       "password": "admin123"
     }
     ```

3. **اضغط Send**

### الحل 3: استخدام curl (Command Line)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

### الحل 4: استخدام PowerShell (على Windows)

```powershell
$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### الحل 5: استخدام JavaScript (من Console المتصفح)

افتح Console في المتصفح (F12) ثم الصق:

```javascript
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## 📝 أمثلة على الطلبات

### 1. تسجيل الدخول

**Request:**
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@gov.ma",
      "full_name": "مدير النظام",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. الحصول على قائمة المستخدمين (يتطلب Token)

**Request:**
```http
GET http://localhost:3000/api/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. إنشاء مراسلة (يتطلب Token)

**Request:**
```http
POST http://localhost:3000/api/messages
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "subject": "اختبار المراسلة",
  "content": "هذا محتوى المراسلة",
  "message_type": "internal",
  "priority": "normal",
  "recipient_ids": [2]
}
```

## 🎯 نصائح

1. **استخدم صفحة الاختبار** (`http://localhost:3000`) - الأسهل للمبتدئين
2. **استخدم Postman** - أفضل للمطورين
3. **احفظ Token** - ستحتاجه للطلبات المحمية
4. **راجع README.md** - للتوثيق الكامل

## 🔗 روابط مفيدة

- **صفحة الاختبار:** http://localhost:3000
- **Health Check:** http://localhost:3000/health
- **معلومات Auth API:** http://localhost:3000/api/auth (GET)

## ⚠️ ملاحظات مهمة

1. تأكد من تشغيل الخادم قبل الاختبار
2. تأكد من تهيئة قاعدة البيانات
3. تأكد من إنشاء مستخدم المسؤول
4. استخدم Token في Header للطلبات المحمية:
   ```
   Authorization: Bearer <your-token>
   ```

---

**تم البناء بـ ❤️**

