require('dotenv').config();
const db = require('../db');

/**
 * Diagnostic script to check approval records
 */
async function testApprovals() {
  try {
    console.log('🔍 Testing Approval System...\n');

    // 1. Check if there are any managers/admins
    console.log('1. Checking managers and admins...');
    const managers = await db.query(
      "SELECT id, username, email, role, is_active FROM users WHERE role IN ('admin', 'manager') AND is_active = true"
    );
    console.log(`   Found ${managers.rows.length} active managers/admins:`);
    managers.rows.forEach(m => {
      console.log(`   - ${m.username} (${m.email}) - Role: ${m.role}`);
    });
    console.log('');

    // 2. Check messages that require approval
    console.log('2. Checking messages that require approval...');
    const messages = await db.query(
      "SELECT id, subject, sender_id, status, requires_approval, message_type FROM messages WHERE requires_approval = true ORDER BY created_at DESC LIMIT 10"
    );
    console.log(`   Found ${messages.rows.length} messages requiring approval:`);
    messages.rows.forEach(m => {
      console.log(`   - ID: ${m.id}, Subject: ${m.subject}, Status: ${m.status}, Type: ${m.message_type}`);
    });
    console.log('');

    // 3. Check approval records
    console.log('3. Checking approval records...');
    const approvals = await db.query(
      "SELECT a.id, a.message_id, a.approver_id, a.status, m.subject as message_subject, u.username as approver_name FROM approvals a LEFT JOIN messages m ON a.message_id = m.id LEFT JOIN users u ON a.approver_id = u.id ORDER BY a.created_at DESC LIMIT 20"
    );
    console.log(`   Found ${approvals.rows.length} approval records:`);
    approvals.rows.forEach(a => {
      console.log(`   - Approval ID: ${a.id}, Message ID: ${a.message_id}, Subject: ${a.message_subject}, Approver: ${a.approver_name}, Status: ${a.status}`);
    });
    console.log('');

    // 4. Check pending approvals
    console.log('4. Checking pending approvals...');
    const pending = await db.query(
      "SELECT a.id, a.message_id, a.approver_id, a.status, m.subject as message_subject, u.username as approver_name FROM approvals a LEFT JOIN messages m ON a.message_id = m.id LEFT JOIN users u ON a.approver_id = u.id WHERE a.status = 'pending' ORDER BY a.created_at DESC"
    );
    console.log(`   Found ${pending.rows.length} pending approvals:`);
    pending.rows.forEach(a => {
      console.log(`   - Approval ID: ${a.id}, Message ID: ${a.message_id}, Subject: ${a.message_subject}, Approver: ${a.approver_name}`);
    });
    console.log('');

    // 5. Check recent messages from regular users
    console.log('5. Checking recent messages from regular users...');
    const userMessages = await db.query(
      `SELECT m.id, m.subject, m.status, m.requires_approval, m.message_type, 
              u.username as sender_name, u.role as sender_role,
              (SELECT COUNT(*) FROM approvals WHERE message_id = m.id) as approval_count
       FROM messages m
       INNER JOIN users u ON m.sender_id = u.id
       WHERE u.role = 'user'
       ORDER BY m.created_at DESC
       LIMIT 10`
    );
    console.log(`   Found ${userMessages.rows.length} recent messages from regular users:`);
    userMessages.rows.forEach(m => {
      console.log(`   - ID: ${m.id}, Subject: ${m.subject}, Status: ${m.status}, Requires Approval: ${m.requires_approval}, Approval Records: ${m.approval_count}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

testApprovals();

