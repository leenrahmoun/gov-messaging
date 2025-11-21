# 🔧 Admin Login Fix Guide

## ✅ Issue Fixed!

The admin login issue has been resolved. Here's what was fixed:

### Problems Found:
1. ❌ Reset password script was using wrong column name (`password` instead of `password_hash`)
2. ❌ Frontend login page only accepted email, not username
3. ❌ No comprehensive diagnostic/fix script

### Solutions Applied:
1. ✅ Fixed `resetAdminPassword.js` to use correct column name
2. ✅ Updated frontend login to accept both username and email
3. ✅ Created comprehensive `fixAdminLogin.js` script
4. ✅ Added npm scripts for easy access

---

## 🚀 Quick Fix Commands

### Option 1: Comprehensive Fix (Recommended)
```bash
cd Back
npm run fix-admin
```

This script will:
- Check if admin user exists
- Create admin if it doesn't exist
- Reset password to default
- Ensure user is active
- Ensure user has admin role
- Verify credentials work

### Option 2: Reset Password Only
```bash
cd Back
npm run reset-admin-password
```

This will reset the admin password using values from `.env`:
- `RESET_ADMIN_PASS` (default: `admin123`)
- `RESET_ADMIN_USER` (default: `admin`)
- `RESET_ADMIN_EMAIL` (default: `admin@gov.ma`)

### Option 3: Create New Admin
```bash
cd Back
npm run create-admin
```

This creates a new admin user (won't create if already exists).

---

## 🔑 Default Admin Credentials

After running the fix script, you can login with:

**Username:** `admin`  
**Email:** `admin@gov.ma`  
**Password:** `admin123`

⚠️ **Important:** Change the password after first login!

---

## 📝 Login Instructions

### Frontend (React App)
1. Navigate to `http://localhost:5173`
2. Enter username: `admin` (or email: `admin@gov.ma`)
3. Enter password: `admin123`
4. Click "Login"

### Backend API (Postman/curl)
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Or using email:
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "admin@gov.ma",
  "password": "admin123"
}
```

---

## 🔍 Troubleshooting

### Still Can't Login?

1. **Check if admin user exists:**
   ```bash
   cd Back
   npm run fix-admin
   ```

2. **Verify database connection:**
   ```bash
   cd Back
   npm run test-db
   ```

3. **Check backend is running:**
   ```bash
   curl http://localhost:3000/health
   ```

4. **Verify .env file:**
   - Make sure `DATABASE_URL` is correct
   - Make sure `JWT_SECRET` is set
   - Check `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` values

5. **Check browser console:**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

### Common Issues:

**Issue:** "User not found"
- **Solution:** Run `npm run fix-admin` or `npm run create-admin`

**Issue:** "Password incorrect"
- **Solution:** Run `npm run reset-admin-password`

**Issue:** "Account disabled"
- **Solution:** Run `npm run fix-admin` (it will activate the account)

**Issue:** "CORS error"
- **Solution:** Make sure backend is running and CORS is configured

**Issue:** "Network error"
- **Solution:** 
  - Check backend is running on port 3000
  - Check frontend `.env` has `VITE_API_BASE=http://localhost:3000/api`
  - Check firewall/antivirus isn't blocking connections

---

## 📚 Related Scripts

All available npm scripts in `Back/`:

```bash
npm run start              # Start server
npm run dev                # Start server (dev mode)
npm run init-db            # Initialize database
npm run create-admin       # Create admin user
npm run fix-admin          # Fix admin login (comprehensive)
npm run reset-admin-password  # Reset admin password
npm run test-db            # Test database connection
```

---

## ✅ Verification

After fixing, verify login works:

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Test Login API:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

3. **Frontend Login:**
   - Open `http://localhost:5173`
   - Try logging in with `admin` / `admin123`

---

## 🎉 Success!

If you can login successfully, the issue is resolved! 

Remember to:
- ✅ Change the default password after first login
- ✅ Keep your `.env` file secure
- ✅ Don't commit `.env` to version control

---

**Last Updated:** 2024  
**Script:** `Back/scripts/fixAdminLogin.js`

