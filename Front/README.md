# Gov Messaging UI

**نظام المراسلات الحكومية - واجهة المستخدم**

A professional, government-grade React frontend application for the Gov Messaging System, built with React, Vite, and TailwindCSS.

## 🚀 Features

- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Message Management** - Create, view, and manage messages
- ✅ **File Attachments** - Upload and download attachments
- ✅ **User Management** - Role-based access control (Admin, Manager, User)
- ✅ **Responsive Design** - Mobile-friendly UI with TailwindCSS
- ✅ **WCAG 2.1 AA Compliant** - Accessible design
- ✅ **Protected Routes** - Secure route protection
- ✅ **Real-time Updates** - Dynamic data fetching

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend API running on `http://localhost:3000/api`

## 🛠️ Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Create `.env` file:**

Create a `.env` file in the root directory:

```env
VITE_API_BASE=http://localhost:3000/api
```

3. **Start development server:**

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
src/
├── api/               # API endpoints and axios configuration
│   ├── axios.js      # Axios instance with interceptors
│   ├── auth.js       # Authentication API
│   ├── messages.js   # Messages API
│   ├── attachments.js # Attachments API
│   ├── users.js      # Users API
│   └── approvals.js  # Approvals API
├── components/        # Reusable UI components
│   ├── Loader.jsx    # Loading spinner
│   ├── Navbar.jsx    # Top navigation bar
│   └── Sidebar.jsx   # Side navigation menu
├── context/           # React Context providers
│   └── AuthContext.jsx # Authentication context
├── layouts/           # Layout components
│   ├── AuthLayout.jsx    # Layout for auth pages
│   └── DashboardLayout.jsx # Layout for dashboard pages
├── pages/             # Page components
│   ├── Login.jsx         # Login page
│   ├── Dashboard.jsx     # Dashboard page
│   ├── Messages.jsx      # Messages list page
│   ├── Compose.jsx       # Compose message page
│   └── ViewMessage.jsx   # View message details page
├── routes/             # Route components
│   └── ProtectedRoute.jsx # Protected route wrapper
├── utils/              # Utility functions
│   ├── token.js         # Token management
│   └── validation.js    # Input validation
├── App.jsx             # Main app component with routing
├── main.jsx            # Entry point
└── index.css           # Global styles with TailwindCSS
```

## 🎨 UI Components

### Color Palette

- **Government Blue**: `#1e3a8a` (Primary)
- **Government Blue Dark**: `#1e40af`
- **Government Blue Light**: `#3b82f6`
- **Gray**: `#64748b` (Secondary)

### Custom Tailwind Classes

- `.btn-primary` - Primary button style
- `.btn-secondary` - Secondary button style
- `.input-field` - Input field style
- `.card` - Card container style

## 🔐 Authentication

The application uses JWT tokens stored in `sessionStorage` for security. Tokens are automatically included in API requests via axios interceptors.

### Login Flow

1. User enters email and password
2. API validates credentials
3. JWT token is received and stored
4. User is redirected to dashboard
5. Token is included in all subsequent requests

### Protected Routes

All routes except `/login` are protected and require authentication. Unauthenticated users are automatically redirected to the login page.

## 📡 API Integration

The frontend connects to the backend API at `http://localhost:3000/api`. All API calls are made through the axios instance configured in `src/api/axios.js`.

### API Endpoints Used

- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user
- `GET /api/messages` - Get messages list
- `POST /api/messages` - Create message
- `GET /api/messages/:id` - Get message details
- `POST /api/attachments/:messageId/upload` - Upload attachment
- `GET /api/attachments/:messageId` - Get attachments
- `GET /api/users` - Get users list

## 🧪 Testing

1. **Start the backend server** (if not already running):
   ```bash
   cd ../gov-messaging
   npm start
   ```

2. **Start the frontend**:
   ```bash
   npm run dev
   ```

3. **Access the application**:
   - Open `http://localhost:5173`
   - Login with your credentials
   - Test all features

## 🏗️ Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## 🔒 Security Features

- ✅ JWT token stored in `sessionStorage` (cleared on tab close)
- ✅ Automatic token expiration handling
- ✅ Input sanitization
- ✅ XSS protection
- ✅ CSRF protection via axios interceptors
- ✅ Protected routes
- ✅ Role-based access control

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1920px+)
- Tablet (768px - 1024px)
- Mobile (320px - 767px)

## ♿ Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- Proper ARIA labels
- Focus indicators

## 🐛 Troubleshooting

### API Connection Issues

If you're having trouble connecting to the API:

1. Verify the backend is running on `http://localhost:3000`
2. Check the `.env` file has the correct `VITE_API_BASE` value
3. Check browser console for CORS errors
4. Verify the backend CORS settings allow requests from `http://localhost:5173`

### Authentication Issues

If login is not working:

1. Check browser console for errors
2. Verify the backend authentication endpoint is working
3. Check that tokens are being stored in `sessionStorage`
4. Clear browser cache and try again

## 📝 License

This project is part of the Gov Messaging System.

## 👥 Contributing

This is a government system. Please follow security best practices when contributing.

---

**Built with ❤️ for Government Messaging System**
