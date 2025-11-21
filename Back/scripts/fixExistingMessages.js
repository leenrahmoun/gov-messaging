require('dotenv').config();
const db = require('../db');

/**
 * Fix existing messages from regular users that don't have approval records
 * This script will:
 * 1. Find messages from regular users with requires_approval = false
 * 2. Update them to requires_approval = true
 * 3. Create approval records for all managers/admins
 */
async function fixExistingMessages() {
  try {
    console.log('🔧 Fixing existing messages from regular users...\n');

    // Find messages from regular users that don't require approval
    const messages = await db.query(
      `SELECT m.id, m.subject, m.status, m.requires_approval, m.message_type,
              u.username as sender_name, u.role as sender_role
       FROM messages m
       INNER JOIN users u ON m.sender_id = u.id
       WHERE u.role = 'user' 
         AND m.requires_approval = false
         AND m.status IN ('draft', 'pending_approval')
       ORDER BY m.created_at DESC`
    );

    console.log(`Found ${messages.rows.length} messages to fix:\n`);

    if (messages.rows.length === 0) {
      console.log('✅ No messages need fixing!');
      process.exit(0);
      return;
    }

    // Get all active managers/admins
    const approvers = await db.query(
      "SELECT id FROM users WHERE role IN ('admin', 'manager') AND is_active = true"
    );

    if (approvers.rows.length === 0) {
      console.log('⚠️  No managers or admins found! Cannot create approval records.');
      process.exit(1);
      return;
    }

    console.log(`Found ${approvers.rows.length} managers/admins for approval records\n`);

    let fixedCount = 0;
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      for (const message of messages.rows) {
        console.log(`Fixing message ID ${message.id}: "${message.subject}"`);
        
        // Update message to require approval
        await client.query(
          `UPDATE messages 
           SET requires_approval = true, 
               status = CASE WHEN status = 'draft' THEN 'pending_approval' ELSE status END
           WHERE id = $1`,
          [message.id]
        );

        // Check if approval records already exist
        const existingApprovals = await client.query(
          'SELECT id FROM approvals WHERE message_id = $1',
          [message.id]
        );

        if (existingApprovals.rows.length === 0) {
          // Create approval records for all managers/admins
          for (const approver of approvers.rows) {
            await client.query(
              `INSERT INTO approvals (message_id, approver_id, status)
               VALUES ($1, $2, 'pending')`,
              [message.id, approver.id]
            );
          }
          console.log(`  ✅ Created ${approvers.rows.length} approval records`);
        } else {
          console.log(`  ⚠️  Approval records already exist (${existingApprovals.rows.length})`);
        }

        fixedCount++;
      }

      await client.query('COMMIT');
      console.log(`\n✅ Successfully fixed ${fixedCount} messages!`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error fixing messages:', error.message);
    console.error(error);
    process.exitCode = 1;
  } finally {
    process.exit(0);
  }
}

fixExistingMessages();

