# Government Correspondence Management System (GCMS)

A secure internal web platform designed for managing official communications, messages, and document workflows within a government institution. The system allows employees to send, track, and approve internal messages and attachments, all within a fully local network environment (no cloud, no AI integrations).

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Technical Architecture](#technical-architecture)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Security Features](#security-features)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🎯 Project Overview

The Government Correspondence Management System (GCMS) is a full-stack web application that provides:

- **Secure Authentication** - JWT-based authentication with role-based access control
- **Message Management** - Create, send, track, and manage official correspondence
- **File Attachments** - Upload and manage document attachments
- **Approval Workflow** - Multi-level approval system for official messages
- **Audit Logging** - Complete audit trail of all system activities
- **User Management** - Comprehensive user administration (Admin only)

---

## ⚙️ Technical Architecture

### 🧱 Backend

**Location:** `Back/`

- **Framework:** Node.js with Express.js
- **Database:** PostgreSQL
- **Language:** JavaScript (ES6)
- **Authentication:** JWT + bcrypt (secure password hashing)
- **Validation:** Express middleware
- **Security:** Helmet, CORS, environment variable configuration (.env)
- **File Upload:** Multer
- **Port:** 3000

**API Endpoints:**
- `/api/auth` - Authentication endpoints
- `/api/messages` - Message management
- `/api/attachments` - File attachment handling
- `/api/approvals` - Approval workflow
- `/api/users` - User management
- `/api/audit` - Audit log access

### 🌐 Frontend

**Location:** `Front/`

- **Framework:** React (with Vite build tool)
- **Styling:** TailwindCSS
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Port:** 5173
- **Environment Variable:** `VITE_API_BASE=http://localhost:3000/api`

---

## 📂 Folder Structure

```
gov-messaging/
│
├── 📁 Back/                          # Backend Application
│   ├── 📁 controllers/               # Business logic controllers
│   │   ├── authController.js        # Authentication logic
│   │   ├── userController.js        # User management
│   │   ├── messageController.js     # Message operations
│   │   ├── attachmentController.js  # File handling
│   │   ├── approvalController.js    # Approval workflow
│   │   └── auditController.js       # Audit logging
│   │
│   ├── 📁 routes/                    # API route definitions
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── attachmentRoutes.js
│   │   ├── approvalRoutes.js
│   │   └── auditRoutes.js
│   │
│   ├── 📁 middleware/                # Express middleware
│   │   ├── auth.js                  # JWT authentication
│   │   ├── audit.js                 # Audit logging middleware
│   │   └── upload.js                # File upload (Multer)
│   │
│   ├── 📁 database/                  # Database schema and initialization
│   │   ├── schema.sql               # PostgreSQL schema
│   │   └── init.js                  # Database initialization script
│   │
│   ├── 📁 db/                        # Database connection
│   │   └── index.js                 # PostgreSQL connection pool
│   │
│   ├── 📁 scripts/                   # Utility scripts
│   │   ├── createAdmin.js           # Create admin user
│   │   ├── resetAdminPassword.js    # Reset admin password
│   │   └── testConnection.js        # Test database connection
│   │
│   ├── 📁 uploads/                   # Uploaded files (created automatically)
│   │
│   ├── 📁 public/                    # Static files
│   │   └── index.html               # API test page
│   │
│   ├── 📄 server.js                  # Main server entry point
│   ├── 📄 package.json               # Backend dependencies
│   ├── 📄 env.example                # Environment variables template
│   └── 📄 README.md                  # Backend documentation
│
├── 📁 Front/                         # Frontend Application
│   ├── 📁 src/
│   │   ├── 📁 api/                   # API client configuration
│   │   │   ├── axios.js             # Axios instance with interceptors
│   │   │   ├── auth.js              # Authentication API calls
│   │   │   ├── messages.js          # Messages API calls
│   │   │   ├── attachments.js      # Attachments API calls
│   │   │   ├── users.js             # Users API calls
│   │   │   └── approvals.js         # Approvals API calls
│   │   │
│   │   ├── 📁 components/            # Reusable UI components
│   │   │   ├── Loader.jsx           # Loading spinner
│   │   │   ├── Navbar.jsx           # Top navigation
│   │   │   └── Sidebar.jsx          # Side navigation menu
│   │   │
│   │   ├── 📁 context/               # React Context providers
│   │   │   └── AuthContext.jsx      # Authentication context
│   │   │
│   │   ├── 📁 layouts/               # Layout components
│   │   │   ├── AuthLayout.jsx        # Layout for auth pages
│   │   │   └── DashboardLayout.jsx  # Layout for dashboard pages
│   │   │
│   │   ├── 📁 pages/                 # Page components
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Dashboard.jsx        # Dashboard page
│   │   │   ├── Messages.jsx         # Messages list
│   │   │   ├── Compose.jsx          # Compose message
│   │   │   ├── ViewMessage.jsx      # View message details
│   │   │   ├── Approvals.jsx        # Approvals management
│   │   │   └── Users.jsx            # User management (Admin)
│   │   │
│   │   ├── 📁 routes/                # Route components
│   │   │   └── ProtectedRoute.jsx   # Protected route wrapper
│   │   │
│   │   ├── 📁 utils/                 # Utility functions
│   │   │   ├── token.js             # Token management
│   │   │   └── validation.js        # Input validation
│   │   │
│   │   ├── 📄 App.jsx                # Main app component with routing
│   │   ├── 📄 main.jsx               # Entry point
│   │   └── 📄 index.css              # Global styles with TailwindCSS
│   │
│   ├── 📁 public/                    # Static assets
│   │   └── vite.svg
│   │
│   ├── 📄 package.json                # Frontend dependencies
│   ├── 📄 vite.config.js              # Vite configuration
│   ├── 📄 tailwind.config.js          # TailwindCSS configuration
│   ├── 📄 postcss.config.js           # PostCSS configuration
│   └── 📄 README.md                   # Frontend documentation
│
└── 📄 README.md                       # This file (root documentation)
```

---

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn** (comes with Node.js)
- **Git** (optional, for version control)

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd gov-messaging
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd Back

# Install dependencies
npm install

# Copy environment variables template
copy env.example .env  # Windows
# or
cp env.example .env    # Linux/Mac

# Edit .env file with your configuration
# Required variables:
# - DATABASE_URL
# - PORT (default: 3000)
# - JWT_SECRET
# - UPLOAD_DIR
# - ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD, etc.
```

**Example `.env` file:**

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

# Admin User Configuration
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@gov.ma
ADMIN_PASSWORD=admin123
ADMIN_FULL_NAME=System Administrator
ADMIN_DEPARTMENT=IT Department
```

### Step 3: Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE gov_messaging;
\q

# Initialize database schema
cd Back
npm run init-db

# Create admin user
npm run create-admin
```

### Step 4: Frontend Setup

```bash
# Navigate to frontend directory
cd Front

# Install dependencies
npm install

# Create .env file
echo "VITE_API_BASE=http://localhost:3000/api" > .env
```

---

## 🎯 Running the Application

### Development Mode

**Terminal 1 - Backend:**

```bash
cd Back
npm run dev
# Server runs on http://localhost:3000
```

**Terminal 2 - Frontend:**

```bash
cd Front
npm run dev
# Application runs on http://localhost:5173
```

### Production Mode

**Backend:**

```bash
cd Back
npm start
```

**Frontend:**

```bash
cd Front
npm run build
npm run preview
```

### Health Check

Verify the backend is running:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "success": true,
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

All API requests (except login/register) require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Main Endpoints

#### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

#### Messages (`/api/messages`)
- `GET /api/messages` - Get messages list (with filters)
- `GET /api/messages/:id` - Get message details
- `POST /api/messages` - Create new message
- `PUT /api/messages/:id` - Update message
- `DELETE /api/messages/:id` - Delete message
- `POST /api/messages/:id/send` - Send message

#### Attachments (`/api/attachments`)
- `POST /api/attachments/:messageId/upload` - Upload attachment
- `GET /api/attachments/:messageId` - Get attachments list
- `GET /api/attachments/download/:id` - Download attachment
- `DELETE /api/attachments/:id` - Delete attachment

#### Approvals (`/api/approvals`)
- `GET /api/approvals` - Get approvals list
- `GET /api/approvals/:id` - Get approval details
- `POST /api/approvals/:id/approve` - Approve message
- `POST /api/approvals/:id/reject` - Reject message

#### Users (`/api/users`) - Admin only
- `GET /api/users` - Get users list
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/reset-password` - Reset password

#### Audit Logs (`/api/audit`) - Manager/Admin only
- `GET /api/audit` - Get audit logs
- `GET /api/audit/stats` - Get audit statistics

For detailed API documentation, see:
- [Backend README](Back/README.md) - Complete API reference
- [Backend PROJECT_STRUCTURE.md](Back/PROJECT_STRUCTURE.md) - Detailed structure

---

## 👥 User Roles

The system supports three user roles with different permissions:

### 🔴 Admin
- **Full system access**
- User management (create, update, delete users)
- View all messages
- Approve/reject messages
- Access audit logs
- System settings management

### 🟡 Manager
- **Message reviewer/approver**
- View all messages
- Approve/reject messages
- Access audit logs
- Create and send messages

### 🟢 Employee
- **Standard user**
- Create and send messages
- View own messages (sent/received)
- Upload attachments
- Update own profile

---

## 🔒 Security Features

### Implemented Security Measures

- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Role-Based Access Control (RBAC)** - Granular permissions
- ✅ **Helmet.js** - Security headers protection
- ✅ **CORS Configuration** - Controlled cross-origin requests
- ✅ **Input Validation** - Server-side validation
- ✅ **SQL Injection Protection** - Parameterized queries
- ✅ **File Upload Security** - Type and size validation
- ✅ **Audit Logging** - Complete activity tracking
- ✅ **XSS Protection** - Input sanitization

### Security Best Practices

1. **Change JWT_SECRET** in production environment
2. **Use HTTPS** in production
3. **Change admin password** after first login
4. **Review audit logs** regularly
5. **Keep `.env` file secure** - never commit to Git
6. **Regular security updates** - keep dependencies updated

---

## 🐛 Troubleshooting

### Backend Issues

**Database Connection Error:**
```bash
# Check PostgreSQL is running
# Verify DATABASE_URL in .env
# Test connection
cd Back
npm run test-db
```

**Port Already in Use:**
```bash
# Change PORT in .env file
# Or kill process using port 3000
```

**JWT Token Issues:**
- Verify `JWT_SECRET` is set in `.env`
- Check token expiration time
- Ensure token is sent in Authorization header

### Frontend Issues

**API Connection Error:**
- Verify backend is running on `http://localhost:3000`
- Check `VITE_API_BASE` in Front/.env
- Check browser console for CORS errors
- Verify backend CORS settings

**Authentication Issues:**
- Clear browser cache and sessionStorage
- Verify token is stored correctly
- Check backend authentication endpoint

For more troubleshooting help, see:
- [Backend TROUBLESHOOTING.md](Back/TROUBLESHOOTING.md)
- [Frontend README.md](Front/README.md)

---

## 📝 Message Statuses

Messages can have the following statuses:

- `draft` - Draft (not sent)
- `pending_approval` - Awaiting approval
- `approved` - Approved by manager
- `sent` - Successfully sent
- `rejected` - Rejected by manager
- `archived` - Archived

---

## 📝 Message Types

- `internal` - Internal message (within organization)
- `external` - External message (to outside recipients)
- `official` - Official correspondence (requires approval)

---

## 📝 Message Priorities

- `low` - Low priority
- `normal` - Normal priority (default)
- `high` - High priority
- `urgent` - Urgent priority

---

## 🤝 Contributing

This is a government system. Please follow security best practices when contributing:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Update documentation for new features
- Test thoroughly before submitting
- Ensure security best practices

---

## 📄 License

This project is licensed under the ISC License.

---

## 📞 Support

For questions and support:

- Check the documentation in `Back/README.md` and `Front/README.md`
- Review troubleshooting guides
- Open an issue in the repository

---

## 🔮 Future Enhancements

Potential features for future development:

- [ ] Email notifications
- [ ] Real-time notifications (WebSocket)
- [ ] Advanced search and filtering
- [ ] Data export functionality
- [ ] Automated backup system
- [ ] Advanced reporting and analytics
- [ ] Mobile application
- [ ] Multi-language support

---

## 📊 Project Status

### ✅ Completed Features

- ✅ Backend API (100%)
- ✅ Frontend UI (100%)
- ✅ Authentication & Authorization
- ✅ Message Management
- ✅ File Attachments
- ✅ Approval Workflow
- ✅ Audit Logging
- ✅ User Management
- ✅ Security Features
- ✅ Documentation

### 🚧 In Progress

- Currently stable and production-ready

---

**Built with ❤️ for Government Messaging System**

*Last Updated: 2024*

