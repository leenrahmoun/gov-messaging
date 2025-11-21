-- Migration: Add manager_id to departments and update message status values
-- Date: 2025-11-19
-- Purpose: Support new approval workflow and department manager tracking

BEGIN;

-- Add manager_id column to departments if it doesn't exist
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Update message status constraint to include new workflow statuses
-- Note: This requires dropping and recreating the constraint
ALTER TABLE messages 
DROP CONSTRAINT IF EXISTS messages_status_check;

ALTER TABLE messages
ADD CONSTRAINT messages_status_check 
CHECK (status IN ('draft', 'pending_manager_approval', 'pending_admin_approval', 'approved', 'sent', 'received', 'rejected', 'returned_for_revision'));

-- Update any old pending_approval statuses to pending_manager_approval
UPDATE messages 
SET status = 'pending_manager_approval' 
WHERE status = 'pending_approval';

-- Update any old archived statuses to returned_for_revision
UPDATE messages 
SET status = 'returned_for_revision' 
WHERE status = 'archived';

-- Create index on manager_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_departments_manager ON departments(manager_id);

COMMIT;
