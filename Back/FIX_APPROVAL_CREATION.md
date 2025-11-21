# 🔧 Fix: Approval Records Not Created for User Messages

## ✅ Issue Fixed!

Messages sent by regular users (employees) were not showing up in the approval page for managers and admins because approval records were not being created.

---

## 🐛 Problem Identified

### Root Causes:

1. **Approval records only created for specific message types:**
   - Only "official" and "external" message types required approval
   - "Internal" messages from regular users didn't require approval
   - No approval records = nothing to show in approvals page

2. **Only one approval record created:**
   - System created approval for only ONE manager/admin (LIMIT 1)
   - If that specific person wasn't available, no one could see it

3. **Missing approval records on send:**
   - If a message was created as draft and later sent, approval records might be missing

---

## ✅ Solution Applied

### Fix 1: Regular Users Always Require Approval

**Changed:** `Back/controllers/messageController.js` - `createMessage()`

```javascript
// Regular users (employees) always require approval for their messages
// Admins and Managers can send without approval unless explicitly required
const finalRequiresApproval = requires_approval || (senderRole === 'user');
```

**Result:** All messages from regular users now require approval, regardless of message type.

### Fix 2: Create Approval Records for ALL Managers/Admins

**Changed:** `Back/controllers/messageController.js` - `createMessage()`

**Before:**
```javascript
// Only created approval for ONE manager/admin
const approverResult = await client.query(
  "SELECT id FROM users WHERE role IN ('admin', 'manager') AND is_active = true LIMIT 1"
);
```

**After:**
```javascript
// Create approval records for ALL active managers and admins
const approverResult = await client.query(
  "SELECT id FROM users WHERE role IN ('admin', 'manager') AND is_active = true"
);

// Create approval record for each manager/admin
for (const approver of approverResult.rows) {
  await client.query(
    `INSERT INTO approvals (message_id, approver_id, status)
     VALUES ($1, $2, 'pending')`,
    [message.id, approver.id]
  );
}
```

**Result:** All managers and admins can now see and approve any pending message.

### Fix 3: Create Missing Approval Records on Send

**Changed:** `Back/controllers/messageController.js` - `sendMessage()`

Added logic to check if approval records exist when sending a draft message, and create them if missing:

```javascript
// If message is draft and requires approval, create approval records if they don't exist
if (message.status === 'draft' && message.requires_approval) {
  const approvalCheck = await db.query(
    'SELECT id FROM approvals WHERE message_id = $1',
    [id]
  );

  // If no approval records exist, create them
  if (approvalCheck.rows.length === 0) {
    // Create approval records for all managers/admins
    // ... (same logic as in createMessage)
  }
}
```

**Result:** Even if approval records were missing, they'll be created when the message is sent.

---

## 📋 Behavior After Fix

### Regular User (Employee) Flow:

1. **User creates message:**
   - Message automatically requires approval (`finalRequiresApproval = true`)
   - Status set to `pending_approval`
   - Approval records created for ALL managers and admins

2. **User sends message:**
   - If approval records missing, they're created automatically
   - Message cannot be sent until approved

3. **Manager/Admin sees message:**
   - Appears in Approvals page
   - Can approve or reject
   - Any manager/admin can approve (not just assigned one)

### Admin/Manager Flow:

1. **Admin/Manager creates message:**
   - Only requires approval if explicitly set (`requires_approval = true`)
   - Or if message type is "official" or "external"
   - Can send directly if no approval needed

2. **Admin/Manager sends message:**
   - If approval required, must wait for approval
   - Otherwise can send immediately

---

## 🧪 Testing

### Test Case 1: Regular User Sends Message

1. **Login as regular user (employee)**
2. **Create a new message:**
   - Fill in subject and content
   - Select recipients
   - Choose any message type (internal, external, official)
   - Click "Create Message"

3. **Expected Result:**
   - Message created with status `pending_approval`
   - Approval records created for all managers/admins

4. **Login as Manager or Admin:**
   - Go to Approvals page
   - **Should see the message** in pending approvals
   - Can approve or reject

### Test Case 2: Multiple Managers/Admins

1. **Create message from regular user**
2. **Login as Manager 1:**
   - Should see message in approvals
3. **Login as Manager 2:**
   - Should also see message in approvals
4. **Login as Admin:**
   - Should also see message in approvals
5. **Any of them can approve** - approval will be processed

---

## 📝 Code Changes Summary

### Backend Files Modified:

1. **`Back/controllers/messageController.js`**
   - `createMessage()`:
     - Added `senderRole` check
     - Regular users always require approval
     - Create approval records for ALL managers/admins (not just one)
   - `sendMessage()`:
     - Added check to create missing approval records
     - Better handling of draft messages requiring approval

---

## ✅ Verification Checklist

- [x] Regular user messages automatically require approval
- [x] Approval records created for ALL managers/admins
- [x] Messages appear in approval page for managers/admins
- [x] Any manager/admin can approve (not just assigned one)
- [x] Missing approval records created on send
- [x] Message status correctly set to `pending_approval`

---

## 🔒 Security Notes

- **Regular users cannot bypass approval** - all their messages require approval
- **Admins/Managers can still send without approval** (unless explicitly required)
- **Approval records visible to all managers/admins** - any can approve
- **Backend enforces approval requirement** - cannot send unapproved messages

---

## 🚨 Important Notes

- **Breaking Change:** Regular users can no longer send messages directly - all require approval
- **Approval records are created for ALL managers/admins** - not just one
- **If approval records are missing, they're created automatically** when sending
- **Message status is set to `pending_approval`** automatically for regular users

---

**Last Updated:** 2024  
**Status:** ✅ Fixed - Approval records now created for all user messages

