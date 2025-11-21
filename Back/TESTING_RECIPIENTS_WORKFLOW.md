# Testing Guide: Role-Based Recipient Filtering & Approval Workflow

## 🎯 Overview

This guide tests the complete implementation of:
- **Department structure** with role-based filtering
- **Recipient filtering** based on user role and department
- **Message approval workflow** (Employee → Manager → Admin)
- **Compliance with international standards** (ISO/IEC 27001, NIST SP 800-53, OECD e-Government, GDPR)

---

## 📋 Prerequisites

1. **Database initialized** with departments table
2. **Seed data loaded** with test users and departments
3. **Backend running** on `http://localhost:3000`
4. **Frontend running** on `http://localhost:5173` (or your dev server)

---

## 🚀 Step 1: Setup Database & Seed Data

### 1.1 Initialize Database Schema

```bash
cd Back
npm run init-db
```

This creates:
- `departments` table
- Updated `users` table with `department_id` FK
- Updated `messages` table with `recipient_id` and department tracking

### 1.2 Seed Test Data

```bash
npm run seed-db
```

This creates:
- **5 Departments**: HR, Finance, IT, Operations, Legal Affairs
- **3 Admins**: Ali Hassan, Noura Khaled, Tarek Omar (no department)
- **5 Managers**: One per department (Sara, Rami, Hanan, Adel, Nada)
- **5 Employees**: Distributed across departments

Default password for all users: `123456`

---

## 🔑 Test Users Overview

### Admins (No Department)
| Name | Email | Role | Department |
|------|-------|------|-----------|
| Ali Hassan | ali.hassan@gov.local | admin | — |
| Noura Khaled | noura.khaled@gov.local | admin | — |
| Tarek Omar | tarek.omar@gov.local | admin | — |

### Managers (One per Department)
| Name | Email | Role | Department |
|------|-------|------|-----------|
| Sara Nasser | sara.nasser@gov.local | manager | Finance |
| Rami Saeed | rami.saeed@gov.local | manager | IT |
| Hanan Yousef | hanan.yousef@gov.local | manager | HR |
| Adel Kamal | adel.kamal@gov.local | manager | Operations |
| Nada Abbas | nada.abbas@gov.local | manager | Legal Affairs |

### Employees (Distributed by Department)
| Name | Email | Role | Department |
|------|-------|------|-----------|
| Omar Khaled | omar.khaled@gov.local | employee | Finance |
| Lina Saleh | lina.saleh@gov.local | employee | Finance |
| Hussein Ali | hussein.ali@gov.local | employee | HR |
| Amal Fathi | amal.fathi@gov.local | employee | IT |
| Maya Rashed | maya.rashed@gov.local | employee | Operations |
| Khalid Ibrahim | khalid.ibrahim@gov.local | employee | Legal Affairs |

---

## 🧪 Test Scenarios

### Test 1: Admin Recipient Filtering

**Objective**: Verify admins can message anyone

**Steps**:
1. Login as **Ali Hassan** (admin) with `ali.hassan@gov.local` / `123456`
2. Navigate to **Compose Message**
3. Call endpoint manually:
   ```bash
   curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/users/meta/recipients
   ```

**Expected Results**:
- Response should include **all users** grouped by role:
  ```json
  {
    "success": true,
    "data": {
      "grouped": {
        "admins": [
          { "id": 1, "full_name": "Ali Hassan", "role": "admin", "email": "ali.hassan@gov.local" },
          { "id": 2, "full_name": "Noura Khaled", "role": "admin", "email": "noura.khaled@gov.local" },
          { "id": 3, "full_name": "Tarek Omar", "role": "admin", "email": "tarek.omar@gov.local" }
        ],
        "managers": [ /* all 5 managers */ ],
        "employees": [ /* all 5 employees */ ]
      }
    }
  }
  ```
- **Total recipients**: 13 users (3 admins + 5 managers + 5 employees)

---

### Test 2: Manager Recipient Filtering

**Objective**: Verify managers can message admins, other managers, and their own dept employees

**Scenario A: Finance Manager**
1. Login as **Sara Nasser** (manager, Finance) with `sara.nasser@gov.local` / `123456`
2. Get recipients via:
   ```bash
   curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/users/meta/recipients
   ```

**Expected Results for Finance Manager**:
- **Admins**: 3 (Ali, Noura, Tarek)
- **Managers**: 4 (Rami, Hanan, Adel, Nada - NOT Sara herself)
- **Employees**: 2 (Omar Khaled, Lina Saleh - Finance dept only)
- **Total**: 9 recipients

**Verification**:
```json
{
  "admins": [3 admins],
  "managers": [4 other managers],
  "employees": [2 Finance employees]
}
```

---

### Test 3: Employee Recipient Filtering

**Objective**: Verify employees can only message their manager and admins

**Scenario: Finance Employee**
1. Login as **Omar Khaled** (employee, Finance) with `omar.khaled@gov.local` / `123456`
2. Get recipients via:
   ```bash
   curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/users/meta/recipients
   ```

**Expected Results for Finance Employee**:
- **Admins**: 3 (all admins)
- **Managers**: 1 (Sara Nasser - Finance manager only)
- **Employees**: 0 (cannot message employees)
- **Total**: 4 recipients

**Verification**:
```json
{
  "admins": [3 admins],
  "managers": [1 manager - Sara],
  "employees": []
}
```

---

### Test 4: Message Approval Workflow - Employee → Manager

**Objective**: Verify employee message is routed to manager for approval

**Steps**:

1. **Login as Employee** (Omar Khaled)
2. **Create Draft Message**:
   ```bash
   POST /api/messages
   Content-Type: application/json
   
   {
     "subject": "Finance Report Request",
     "content": "Need approval for Q4 budget allocation",
     "message_type": "internal",
     "priority": "high",
     "recipient_ids": [4],  # Sara Nasser (Finance Manager)
     "requires_approval": true
   }
   ```

3. **Response**: Message created with status `draft`
   ```json
   {
     "success": true,
     "data": {
       "message": {
         "id": 1,
         "status": "draft",
         "sender_id": 9,
         "recipient_id": 4,
         "sender_department_id": 2,  # Finance dept
         "requires_approval": true
       }
     }
   }
   ```

4. **Submit Message for Approval**:
   ```bash
   POST /api/messages/1/submit
   ```

5. **Expected Result**: Message status changes to `pending_approval`
   ```json
   {
     "success": true,
     "message": "Message submitted for approval",
     "data": {
       "message": {
         "id": 1,
         "status": "pending_approval",
         "requires_approval": true
       }
     }
   }
   ```

6. **Verify Approval Record Created**:
   - Query: `SELECT * FROM approvals WHERE message_id = 1`
   - Should show: `approver_id = 4` (Sara Nasser), `status = 'pending'`

---

### Test 5: Message Approval - Manager Approves

**Objective**: Verify manager can approve employee's message

**Steps**:

1. **Login as Manager** (Sara Nasser)
2. **Get Pending Messages for Approval**:
   ```bash
   GET /api/messages?status=pending_approval
   ```

3. **Approve Message**:
   ```bash
   POST /api/messages/1/approve
   Content-Type: application/json
   
   {
     "notes": "Approved for processing"
   }
   ```

4. **Expected Result**:
   ```json
   {
     "success": true,
     "message": "Message approved",
     "data": {
       "message": {
         "id": 1,
         "status": "approved",
         "approved_by": 4,  # Sara Nasser
         "approved_at": "2025-11-13T10:30:00Z"
       }
     }
   }
   ```

5. **Verify Approval Record Updated**:
   - Query: `SELECT * FROM approvals WHERE message_id = 1`
   - Should show: `status = 'approved'`, `approved_at = NOW()`

---

### Test 6: Message Rejection

**Objective**: Verify manager can reject message and send back to employee

**Steps**:

1. **Create New Message** (as employee, same as Test 4)
2. **Submit for Approval** (same as Test 4)
3. **Login as Manager** (Sara Nasser)
4. **Reject Message**:
   ```bash
   POST /api/messages/2/reject
   Content-Type: application/json
   
   {
     "notes": "Missing required details. Please resubmit with clarification."
   }
   ```

5. **Expected Result**:
   ```json
   {
     "success": true,
     "message": "Message rejected",
     "data": {
       "message": {
         "id": 2,
         "status": "rejected",
         "approval_notes": "Missing required details..."
       }
     }
   }
   ```

6. **Employee Can Resubmit**: Employee can now edit and resubmit

---

### Test 7: Cross-Department Manager Communication

**Objective**: Verify managers can message other managers and admins

**Steps**:

1. **Login as Sara Nasser** (Finance Manager)
2. **Create Message to Rami Saeed** (IT Manager):
   ```bash
   POST /api/messages
   {
     "subject": "IT Support Request",
     "content": "Need assistance with network setup",
     "message_type": "internal",
     "priority": "normal",
     "recipient_ids": [5],  # Rami Saeed
     "requires_approval": false  # Managers don't require approval for cross-dept messaging
   }
   ```

3. **Expected Result**: Message status = `draft` (no approval needed for manager-to-manager)

---

### Test 8: Frontend Recipient Dropdown

**Objective**: Verify Compose page shows correct recipients

**Steps**:

1. **Login as Employee** (Omar Khaled)
2. **Navigate to Compose Message** page
3. **Verify Recipient Dropdown**:
   - Should show **Admins group** (3 users)
   - Should show **Managers group** (1 user - Sara only)
   - Should **NOT show Employees group**

4. **Login as Manager** (Sara Nasser)
5. **Navigate to Compose Message** page
6. **Verify Recipient Dropdown**:
   - Should show **Admins group** (3 users)
   - Should show **Managers group** (4 users - all except Sara)
   - Should show **Employees group** (2 users - Finance dept only)

7. **Login as Admin** (Ali Hassan)
8. **Navigate to Compose Message** page
9. **Verify Recipient Dropdown**:
   - Should show **ALL users** (13 total)
   - All groups visible

---

## 📊 Compliance Verification

### ISO/IEC 27001: Role-Based Least Privilege

✅ **Verified By**:
- Employees cannot message other employees
- Employees can only escalate to managers/admins
- Managers isolated to their department
- Admins have full visibility

### NIST SP 800-53: Structured Access Control

✅ **Verified By**:
- Department boundaries enforced
- Manager approval required for employee messages
- Audit logs track all actions
- Explicit authorization checks in code

### OECD e-Government Framework

✅ **Verified By**:
- Transparent role definitions
- Department structure matches typical government organization
- Multi-level approval workflow
- Inter-departmental communication enabled for managers

### GDPR Principle of Data Minimization

✅ **Verified By**:
- Employees only see their manager and admins
- Managers see only their department + admins + other managers
- No user can access data outside their scope

---

## 🔍 Audit Logging Verification

**Objective**: Verify all actions are logged

**Check Audit Logs**:
```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/audit
```

**Expected Actions Logged**:
- `message:create` - Message created
- `message:submit` - Message submitted for approval
- `message:approve` - Message approved
- `message:reject` - Message rejected
- `message:send` - Message sent

**Audit Log Entry Example**:
```json
{
  "id": 1,
  "user_id": 9,
  "action": "message:submit",
  "entity_type": "message",
  "entity_id": 1,
  "description": "Message submitted for approval",
  "metadata": { "approverId": 4 },
  "created_at": "2025-11-13T10:25:00Z"
}
```

---

## 🐛 Troubleshooting

### Issue: Recipients endpoint returns empty arrays

**Solution**:
1. Verify users have correct `department_id` in database
2. Check user `role` is one of: `admin`, `manager`, `employee`
3. Verify seed script ran successfully: `npm run seed-db`

### Issue: Message cannot be submitted

**Solution**:
1. Ensure user's department is set
2. Verify approver (manager or admin) exists
3. Check message status is `draft` before submitting

### Issue: Manager cannot approve message from different department

**Expected behavior** - This is correct! Managers can only approve from their own department.

### Issue: Employee message doesn't go to manager

**Solution**:
1. Verify employee has `department_id` set
2. Verify manager exists for that department
3. Check `approvals` table has correct `approver_id`

---

## ✅ Final Checklist

- [ ] Database initialized with departments
- [ ] Seed data loaded (14 test users, 5 departments)
- [ ] Admin can message all users
- [ ] Manager can message admins + other managers + own dept employees
- [ ] Employee can message manager + admins only
- [ ] Messages submitted by employees go to manager for approval
- [ ] Manager can approve/reject messages
- [ ] Frontend dropdown shows correct recipients per role
- [ ] Audit logs track all actions
- [ ] Role-based access control enforced
- [ ] Compliance requirements met (ISO/IEC, NIST, OECD, GDPR)

---

## 📚 Related Documentation

- `QUICK_START.md` - Backend setup
- `SETUP.md` - Database setup
- `PROJECT_STRUCTURE.md` - Code organization
- `schema.sql` - Database structure

---

**Last Updated**: November 13, 2025
**Version**: 1.0.0
