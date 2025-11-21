# Quick Reference: Department-Based Role Management

## 🚀 Quick Start (5 Minutes)

### 1. Initialize Database

```bash
cd Back
npm run init-db
```

### 2. Load Test Data

```bash
npm run seed-db
```

### 3. Start Backend

```bash
npm start
```

### 4. Start Frontend (new terminal)

```bash
cd Front
npm run dev
```

### 5. Test It

- Go to `http://localhost:5173`
- Login as any test user
- Create a message and verify recipient filtering

---

## 👥 Test Users (Password: `123456`)

### Admins

- `ali.hassan@gov.local` - Can message EVERYONE
- `noura.khaled@gov.local`
- `tarek.omar@gov.local`

### Managers (1 per Department)

- `sara.nasser@gov.local` - Finance (can message: 3 admins + 4 managers + 2 employees)
- `rami.saeed@gov.local` - IT
- `hanan.yousef@gov.local` - HR
- `adel.kamal@gov.local` - Operations
- `nada.abbas@gov.local` - Legal

### Employees (Distributed by Dept)

- `omar.khaled@gov.local` - Finance (can message: 1 manager + 3 admins)
- `lina.saleh@gov.local` - Finance
- `hussein.ali@gov.local` - HR
- `amal.fathi@gov.local` - IT
- `maya.rashed@gov.local` - Operations
- `khalid.ibrahim@gov.local` - Legal

---

## 📋 Recipient Counts

| Role | Recipients | Details |
|------|-----------|---------|
| **Admin** | 13 | All users |
| **Manager** | 9 | 3 admins + 4 other managers + 2 dept employees |
| **Employee** | 4 | 1 manager + 3 admins |

---

## 🔄 Message Workflow

```
1. Employee creates message
   ↓
2. Employee submits for approval
   → Message goes to MANAGER
   ↓
3. Manager approves/rejects
   → Status: approved/rejected
   ↓
4. If approved, employee can send
   → Status: sent
```

---

## 🛠️ API Endpoints

### Get Recipients (filtered by role)

```bash
GET /api/users/meta/recipients
Authorization: Bearer <TOKEN>

Response: { admins: [...], managers: [...], employees: [...] }
```

### Create Message

```bash
POST /api/messages
{
  "subject": "Title",
  "content": "Body",
  "message_type": "internal",
  "priority": "normal",
  "recipient_ids": [4],  # Single recipient
  "requires_approval": true
}
```

### Submit for Approval

```bash
POST /api/messages/{id}/submit
```

### Approve Message

```bash
POST /api/messages/{id}/approve
{ "notes": "Optional notes" }
```

### Reject Message

```bash
POST /api/messages/{id}/reject
{ "notes": "Reason for rejection (required)" }
```

---

## 📊 Database Tables

### departments

- `id`, `name`, `description`, `is_active`, `created_at`, `updated_at`

### users

- `id`, `username`, `email`, `password_hash`, `full_name`, `role`, **`department_id`** (FK), `is_active`

### messages

- `id`, `message_number`, `subject`, `content`, `sender_id` (FK), **`recipient_id`** (FK)
- `sender_department_id` (FK), `receiver_department_id` (FK)
- `status`, `requires_approval`, `approved_by` (FK), `approved_at`

### approvals

- `id`, `message_id` (FK), `approver_id` (FK), `status`, `comments`, `approved_at`

---

## ✅ Compliance

✓ **ISO/IEC 27001** - Role-based least privilege  
✓ **NIST SP 800-53** - Structured access control  
✓ **OECD e-Government** - Transparent hierarchy  
✓ **GDPR** - Data minimization (minimal scope access)

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Recipients empty | Verify `department_id` in DB, check user `role` |
| Cannot submit message | Ensure user has `department_id` and manager exists |
| Cannot approve | Manager can only approve from own department (by design) |
| Seed failed | Ensure DB initialized first with `npm run init-db` |

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `Back/database/schema.sql` | Database structure |
| `Back/controllers/userController.js` | Recipients logic |
| `Back/controllers/messageController.js` | Approval workflow |
| `Back/seed/seed-data.json` | Test data |
| `Front/src/pages/Compose.jsx` | Message compose UI |
| `TESTING_RECIPIENTS_WORKFLOW.md` | Full testing guide |
| `IMPLEMENTATION_SUMMARY.md` | Complete documentation |

---

## 🎯 Test Scenarios (8 Total)

1. Admin sees all 13 recipients
2. Manager sees 9 recipients (admins + other managers + own dept)
3. Employee sees 4 recipients (manager + admins)
4. Employee submits message → goes to manager
5. Manager approves message
6. Manager rejects message
7. Manager messages other manager
8. Frontend dropdown shows correct recipients

---

## 📞 Support

See `TESTING_RECIPIENTS_WORKFLOW.md` for:
- Complete step-by-step tests with curl examples
- Expected response formats
- Audit logging verification
- Detailed troubleshooting guide

---

**Version**: 1.0.0  
**Last Updated**: November 13, 2025

