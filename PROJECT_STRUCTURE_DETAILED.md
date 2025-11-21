# 📚 Gov Messaging Project — Detailed Structure & Files

This is a **government secure internal correspondence system** built with Node.js + React + PostgreSQL. Below is a comprehensive breakdown of every folder and file.

---

## 📊 Project Overview

**Purpose:** A role-based messaging system for government departments with approval workflows, audit logging, and compliance standards (ISO 27001, NIST, GDPR, OECD).

**Tech Stack:**
- **Backend:** Node.js + Express.js
- **Frontend:** React 19 + Vite + Tailwind CSS
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs
- **File Upload:** Multer
- **Security:** Helmet, CORS
- **API Client:** Axios

---

## 📁 Root Level (`/gov-messaging`)

### 📄 Files

| File | Purpose |
|------|---------|
| `README.md` | Main project documentation with setup instructions and API overview |
| `STARTUP_GUIDE.md` | Quick start checklist for setting up PostgreSQL, backend, and frontend |
| `QUICK_REFERENCE.md` | Quick lookup guide for common API endpoints and test scenarios |
| `IMPLEMENTATION_SUMMARY.md` | Detailed implementation notes for department-based role management system |
| `qa_report.json` | QA test results in JSON format |
| `qa_report_summary.json` | Summary of QA test findings |
| `qa_e2e_test.js` | End-to-end test suite |

### 📁 Directories

- **`Back/`** — Backend Express API server
- **`Front/`** — Frontend React UI application

---

## 🔧 Backend (`/Back`)

The backend implements all business logic, authentication, message handling, approvals, and audit logging.

### 📄 Core Files

| File | Purpose |
|------|---------|
| `server.js` | **Entry point** — Initializes Express, configures middleware, loads routes |
| `package.json` | **Dependencies & scripts** — Lists all npm packages and run commands |
| `.env` | **Environment variables** — Database URL, JWT secret, admin credentials (⚠️ not in Git) |
| `.env.example` | **Template** — Example `.env` file showing required variables |
| `.gitignore` | **Git exclusions** — Excludes `node_modules/`, `.env`, `uploads/` from version control |

### 🎮 `/controllers` (6 files)

Controllers contain business logic for handling requests.

| File | Exports | Key Functions |
|------|---------|---------------|
| `authController.js` | Auth logic | `register()`, `login()`, `getProfile()`, `updateProfile()`, `changePassword()` |
| `userController.js` | User management | `getAllUsers()`, `getRecipients()`, `updateUser()`, `deleteUser()` |
| `messageController.js` | Message operations | `createMessage()`, `getMessages()`, `updateMessage()`, `deleteMessage()`, `sendMessage()` |
| `attachmentController.js` | File handling | `uploadAttachment()`, `downloadAttachment()`, `deleteAttachment()` |
| `approvalController.js` | Approval workflow | `createApproval()`, `approveMessage()`, `rejectMessage()`, `getApprovals()` |
| `auditController.js` | Audit logging | `getAuditLogs()`, `getAuditStats()`, audit log retrieval |

**Key Logic:**
- Role-based access control (Admin → Manager → Employee)
- Recipient filtering by role and department
- Message approval workflow with status tracking
- Bcrypt password hashing with salt rounds

---

### 🛣️ `/routes` (6 files)

Routes map HTTP requests to controller functions.

| File | Base Path | Protected | Endpoints |
|------|-----------|-----------|-----------|
| `authRoutes.js` | `/api/auth` | ❌ (login/register open) | POST `/login`, `/register`, GET `/profile`, PUT `/profile`, POST `/change-password` |
| `userRoutes.js` | `/api/users` | ✅ | GET `/`, `/:id`, `/meta/recipients`, PUT `/:id`, DELETE `/:id` |
| `messageRoutes.js` | `/api/messages` | ✅ | GET `/`, `/:id`, POST `/create`, `/send/:id`, DELETE `/:id` |
| `attachmentRoutes.js` | `/api/attachments` | ✅ | POST `/upload`, GET `/download/:id`, DELETE `/:id` |
| `approvalRoutes.js` | `/api/approvals` | ✅ | GET `/`, POST `/approve/:id`, `/reject/:id` |
| `auditRoutes.js` | `/api/audit` | ✅ (manager/admin only) | GET `/`, `/stats` |

---

### 🔒 `/middleware` (3 files)

Middleware functions run between request and controller.

| File | Purpose | Key Function(s) |
|------|---------|-----------------|
| `auth.js` | **JWT authentication** — Validates Bearer tokens, extracts user info | `authenticateToken()`, role-checking helpers |
| `audit.js` | **Audit logging** — Logs all API requests with user, action, timestamp | `auditLog()` middleware |
| `upload.js` | **File upload** — Multer configuration for handling multipart form data | `upload` (single/multiple file handling) |

**Details:**
- `auth.js` verifies JWT signature, checks expiration, attaches `req.user`
- `audit.js` logs to `audit_logs` table after each request
- `upload.js` limits file size (10MB default), stores to `./uploads/`

---

### 💾 `/database` (2 files + migrations)

Database schema and initialization.

| File | Purpose |
|------|---------|
| `schema.sql` | **PostgreSQL schema** — Table definitions, relationships, indexes, triggers, audit triggers |
| `init.js` | **Initialization script** — Runs `schema.sql` on startup; creates `gov_messaging` DB if missing |
| `migrations/2025-11-12-rebuild-core-schema.sql` | **Migration** — Latest schema rebuild with departments, approvals, proper FKs |

**Tables Created:**
1. `users` — User accounts (id, username, email, password_hash, role, department_id, is_active, created_at, updated_at)
2. `departments` — Organization departments (id, name, description, created_at)
3. `messages` — Correspondence (id, sender_id, recipient_id, subject, content, status, attachments, approval_status, created_at, updated_at)
4. `recipients` — Message recipients metadata (message_id, recipient_id, read_at)
5. `attachments` — File attachments (id, message_id, filename, filepath, size, mime_type, uploaded_at)
6. `approvals` — Message approvals (id, message_id, approver_id, action, comments, status, created_at)
7. `audit_logs` — Action audit trail (id, user_id, action, description, ip_address, created_at)

---

### 🔌 `/db` (1 file)

Database connection pool.

| File | Purpose |
|------|---------|
| `index.js` | **PostgreSQL pool** — Creates `pg.Pool` instance, exports `query()` helper and connection methods |

**Exports:**
- `query(text, params)` — Execute parameterized SQL queries
- `getClient()` — Get raw client for transactions
- `pool` — Raw pool instance

---

### 🛠️ `/scripts` (Multiple utility files)

Utility scripts for setup, data migration, and testing.

| File | Purpose | Usage |
|------|---------|-------|
| `createAdmin.js` | **Create initial admin user** — Reads ADMIN_* vars from `.env`, creates hashed password, inserts admin | `npm run create-admin` |
| `seedDatabase.js` | **Seed test data** — Creates departments, test users, assigns roles | `npm run seed-db` |
| `testConnection.js` | **Test DB connection** — Verifies PostgreSQL connection and basic query | `npm run test-db` |
| `resetAdminPassword.js` | **Reset admin password** — Updates admin password in database | `npm run reset-admin-password` |
| `fixAdminLogin.js` | **Repair admin login** — Fixes common admin login issues | `npm run fix-admin` |
| `fixExistingMessages.js` | **Fix message data** — Repairs legacy message records | `npm run fix-messages` |
| `ensureSchema.js` | Ensures schema is up to date | Direct call |
| `ensureUserStatus.js` | Ensures user statuses are correct | Direct call |
| `normalizeRoles.js` | Normalizes user roles | Direct call |
| `bootstrapDepartments.js` | Creates core departments on startup | Direct call |
| `setupTestUsers.js` | Sets up test user accounts | Direct call |
| `testApprovals.js` | Tests approval workflow | `npm run test-approvals` |

---

### 🌐 `/public` (1 file)

Static assets served by Express.

| File | Purpose |
|------|---------|
| `index.html` | **API test page** — Simple HTML interface to test auth and API endpoints without frontend |

---

### 📁 `/uploads`

**Directory for uploaded files** — Created automatically when files are uploaded via API. Do not commit to Git.

---

### 📁 `/seed`

Contains seed/test data.

| File | Purpose |
|------|---------|
| `seed-data.json` | **Test data** — Pre-defined departments, users, messages for testing |

---

### 📚 Documentation Files (Backend)

| File | Purpose |
|------|---------|
| `README.md` | Backend-specific documentation (setup, API reference, testing guide) |
| `PROJECT_STRUCTURE.md` | Detailed breakdown of backend folder structure |
| `PROJECT_SUMMARY.md` | Quick summary of project stats and completion status |
| `QUICK_START.md` | Quick setup guide for backend |
| `SETUP.md` | Detailed setup instructions |
| `HOW_TO_TEST.md` | Guide to testing API endpoints |
| `TESTING_RECIPIENTS_WORKFLOW.md` | Step-by-step test scenarios for approval workflow |
| `IMPLEMENTATION_SUMMARY.md` | Implementation notes and changes made |
| `FIX_*.md` | Quick fix guides for common issues (admin login, passwords, approvals, messages, permissions) |
| `TROUBLESHOOTING.md` | Common issues and solutions |
| `NEXT_STEPS.md` | Future improvements and next phase |

---

## 🎨 Frontend (`/Front`)

React UI application for composing, sending, and approving messages.

### 📄 Core Files

| File | Purpose |
|------|---------|
| `package.json` | **Dependencies & build config** — React, Vite, Tailwind, Axios, React Router |
| `index.html` | **HTML entry point** — Loads React app |
| `vite.config.js` | **Vite build config** — Dev server, build settings, React plugin |
| `tailwind.config.js` | **Tailwind CSS config** — Custom styling configuration |
| `postcss.config.js` | **PostCSS config** — Tailwind CSS processing |
| `eslint.config.js` | **ESLint config** — Code style and quality rules |
| `.env.example` | **Template for environment variables** — API base URL |

---

### 📂 `/src` (Application Code)

#### 🎯 Core App Files

| File | Purpose |
|------|---------|
| `main.jsx` | **Vite entry point** — Renders React app to DOM |
| `App.jsx` | **Main component** — Root component with routes and global state |
| `App.css` | **Global styles** — Application-wide CSS |
| `index.css` | **Base styles** — Tailwind imports and resets |

#### 🔌 `/api` (API Client Layer)

Axios-based HTTP client functions for backend communication.

| File | Functions |
|------|-----------|
| `approvals.js` | `getApprovals()`, `approveMessage()`, `rejectMessage()` |
| `attachments.js` | `uploadAttachment()`, `downloadAttachment()`, `deleteAttachment()` |
| `audit.js` | `getAuditLogs()`, `getAuditStats()` |
| `auth.js` | `login()`, `register()`, `logout()` |
| `messages.js` | `getMessages()`, `createMessage()`, `sendMessage()`, `deleteMessage()` |
| `users.js` | `getAllUsers()`, `getRecipients()`, `getProfile()`, `updateProfile()` |

**Pattern:** All functions accept backend URL from `import.meta.env.VITE_API_BASE`

---

#### 🛠️ `/utils` (Helper Functions)

Utility functions for data formatting, validation, and common operations.

| File (typical) | Purpose |
|---|---|
| `dateFormatter.js` | Format timestamps for display |
| `validation.js` | Form/data validation helpers |
| `constants.js` | Constants used across the app (roles, statuses) |

---

#### 🧩 `/components` (Reusable Components)

Reusable React components for UI elements.

**Typical components:**
- `Header.jsx` — Top navigation bar
- `Sidebar.jsx` — Left sidebar with menu
- `MessageCard.jsx` — Individual message display
- `Button.jsx` — Styled button component
- `Modal.jsx` — Modal dialog
- `LoadingSpinner.jsx` — Loading indicator
- `ErrorBoundary.jsx` — Error handling wrapper

---

#### 📄 `/pages` (Page Components)

Full-page components for different routes.

| Page | Purpose |
|------|---------|
| `Home.jsx` / `Dashboard.jsx` | Dashboard/home page (list of messages, stats) |
| `Login.jsx` | Login form page |
| `Register.jsx` | User registration page |
| `Compose.jsx` | Compose/create new message form |
| `MessageDetail.jsx` | Single message view with full details |
| `Approvals.jsx` | Approval queue for managers/admins |
| `AuditLog.jsx` | Audit log viewer (admin only) |
| `Profile.jsx` | User profile settings page |
| `NotFound.jsx` | 404 page |

---

#### 🎨 `/layouts` (Layout Components)

Layout wrapper components for consistent page structure.

| File | Purpose |
|------|---------|
| `MainLayout.jsx` | Standard layout with header, sidebar, footer |
| `AuthLayout.jsx` | Auth-only layout (login/register, no sidebar) |

---

#### 🛣️ `/routes` (Route Configuration)

React Router route definitions.

| File | Purpose |
|------|---------|
| `index.jsx` | Route definitions and exports |
| `ProtectedRoute.jsx` | High-order component for JWT-protected routes |

---

#### 🔄 `/context` (State Management)

React Context API for global state (authentication, user, theme, etc.).

| File | Purpose |
|------|---------|
| `AuthContext.jsx` | Auth state (user, token, login/logout) |
| `ThemeContext.jsx` (if exists) | Theme/dark mode state |
| `UserContext.jsx` (if exists) | Global user state |

---

#### 📚 `/assets` (Static Resources)

Images, icons, logos used in the UI.

**Typical contents:**
- `logo.png` — Application logo
- `icons/` — SVG/image icons
- `images/` — Background images, illustrations

---

### 📚 Frontend Documentation

| File | Purpose |
|------|---------|
| `README.md` | Frontend setup and running instructions |
| `QUICK_START.md` | Quick start guide for frontend developers |
| `PROJECT_STATUS.md` | Current status of frontend features |
| `fixes/` | Folder with fix documents for common frontend issues |

---

## 🔑 Key Features by Layer

### Backend Features
- ✅ JWT authentication with token expiry
- ✅ Role-based access control (Admin, Manager, Employee)
- ✅ Message creation, sending, approval workflow
- ✅ File upload (attachments) with size limits
- ✅ Department-based recipient filtering
- ✅ Audit logging for compliance
- ✅ Password hashing with bcrypt
- ✅ Request validation
- ✅ Error handling middleware

### Frontend Features
- ✅ Login/register forms
- ✅ Message composition with rich text
- ✅ Message inbox/sent/drafts views
- ✅ Approval queue for managers
- ✅ File attachment upload
- ✅ Recipient dropdown (role-filtered)
- ✅ Audit log viewer
- ✅ User profile management
- ✅ Responsive design (Tailwind CSS)

### Database Features
- ✅ 7 normalized tables
- ✅ Foreign key relationships
- ✅ Timestamps (created_at, updated_at)
- ✅ Audit triggers on sensitive tables
- ✅ Indexes for query performance
- ✅ Soft-delete support (is_active flag)

---

## 🔗 Data Flow

```
User (Browser)
    ↓
    ↓ HTTP/CORS
    ↓
Front-end (React/Vite)
    ↓
    ↓ Axios → API calls
    ↓
Back-end Express Server
    ↓
    ├─ Routes → Controllers
    ├─ Middleware (Auth, Audit, Upload)
    └─ Database (PostgreSQL)
        ├─ Tables
        ├─ Triggers
        └─ Audit Logs
```

---

## 🚀 Typical Workflow

1. **User opens frontend** → React app loads
2. **User logs in** → POST `/api/auth/login` → JWT token returned
3. **Token stored** → Saved in localStorage/sessionStorage
4. **User composes message** → POST `/api/messages/create` → Message saved as draft
5. **User sends message** → POST `/api/messages/send/:id` → Goes to approval queue
6. **Manager approves** → POST `/api/approvals/approve/:id` → Message marked approved
7. **System sends** → Message marked as sent, recipient notified
8. **Audit logged** → All actions recorded in `audit_logs` table

---

## 📊 Project Statistics

- **Backend files:** 25+ (controllers, routes, middleware, scripts)
- **Frontend files:** 30+ (components, pages, utilities)
- **Database tables:** 7
- **API endpoints:** 27+
- **Documentation files:** 20+
- **Total lines of code:** ~5000+

---

## 🛠️ Commands Quick Reference

### Backend
```bash
cd Back
npm install                  # Install dependencies
npm run dev                 # Start development server
npm run init-db             # Initialize database schema
npm run seed-db             # Seed test data
npm run create-admin        # Create admin user
npm run test-db             # Test database connection
npm run fix-admin           # Fix admin login issues
npm run reset-admin-password # Reset admin password
```

### Frontend
```bash
cd Front
npm install                 # Install dependencies
npm run dev                 # Start dev server (port 5173)
npm run build               # Build for production
npm run preview             # Preview production build
npm run lint                # Run ESLint
```

---

## 🔐 Security Checklist

✅ JWT tokens with expiration
✅ Password hashing (bcrypt)
✅ CORS enabled
✅ Helmet security headers
✅ Parameterized SQL queries (prevent injection)
✅ Role-based access control
✅ Audit logging
✅ Request validation
✅ File upload size limits

---

## 📞 Getting Help

- **Setup issues:** See `STARTUP_GUIDE.md`
- **API reference:** See `Back/README.md`
- **Testing:** See `TESTING_RECIPIENTS_WORKFLOW.md`
- **Troubleshooting:** See `TROUBLESHOOTING.md`
- **Quick fixes:** See `FIX_*.md` files

---

**Version:** 1.0.0
**Last Updated:** November 18, 2025
