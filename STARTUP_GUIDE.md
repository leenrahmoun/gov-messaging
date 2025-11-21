# 🚀 Gov Messaging System — Startup Guide

This checklist walks you through preparing the stack (PostgreSQL + backend + frontend) and signing in with an administrator account.

---

## 1. Prerequisites

- Node.js ≥ 16
- npm ≥ 8
- PostgreSQL ≥ 12 running locally (default port `5432`)

---

## 2. Database Setup

1. **Create the database**

   ```bash
   createdb gov_messaging
   # or inside psql:
   # CREATE DATABASE gov_messaging;
   ```

2. **Configure environment variables**

   ```bash
   cd Back
   cp env.example .env
   ```

   Update `.env` with your credentials, for example:

   ```
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/gov_messaging
   JWT_SECRET=change-me
   ```

3. **Install backend dependencies and run the init script**

   ```bash
   npm install
   npm run init-db
   ```

4. **Apply the latest migration** (ensures departments/approvals schema)

   ```bash
   psql "$DATABASE_URL" -f database/migrations/2025-11-12-rebuild-core-schema.sql
   ```

---

## 3. Backend Startup

1. **Create (or recreate) the default admin**

   ```bash
   npm run create-admin
   ```

   By default (matching `env.example`):

   - Email: `admin@gov.ma`
   - Password: `admin123`

   > You can override these values by editing `ADMIN_*` keys in `.env` before running the script.

2. **Launch the API**

   ```bash
   npm run dev
   ```

   The backend listens on `http://localhost:3000`. Verify health:

   ```bash
   curl http://localhost:3000/health
   ```

---

## 4. Frontend Startup

1. **Configure the client**

   ```bash
   cd ../Front
   cp .env.example .env            # create if missing
   echo "VITE_API_BASE=http://localhost:3000/api" > .env
   npm install
   ```

2. **Run the UI**

   ```bash
   npm run dev
   ```

   Open `http://localhost:5173` (port shown in the terminal) and log in using the admin credentials from step 3.

---

## 5. Smoke Test

1. **Authenticate via UI** – log in as the admin created earlier.
2. **Compose a message** – create a draft, submit for approval, approve (as manager/admin), send, then mark as received to exercise the full lifecycle.
3. **Check audit trail** – ensure actions are present in the audit log if the UI exposes it, or query the `audit_logs` table directly.

---

## 6. Helpful Scripts

| Command | Location | Purpose |
| --- | --- | --- |
| `npm run init-db` | `Back/` | Seeds core schema |
| `npm run create-admin` | `Back/` | Creates admin using `.env` defaults |
| `npm run dev` | `Back/` | Runs Express server (port 3000) |
| `npm run build` | `Front/` | Builds production assets |
| `npm run dev` | `Front/` | Runs Vite dev server (default port 5173) |

---

## 7. Troubleshooting

- **Authentication token required**: Sign in through the frontend (or call `/api/auth/login`) to obtain a JWT for API requests.
- **Database connection errors**: confirm `DATABASE_URL`, that PostgreSQL is running, and that `gov_messaging` exists.
- **Missing departments**: re-run the migration in step 2.4.
- **Admin login fails**: rerun `npm run create-admin`, verifying the email/password printed in the console.

Happy messaging! 🎉

