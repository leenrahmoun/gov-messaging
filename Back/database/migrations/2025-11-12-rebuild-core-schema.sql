BEGIN;

-- ============================================================
-- Departments
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) UNIQUE NOT NULL,
  manager_id INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure departments table keeps updated_at current
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'departments_set_updated_at'
  ) THEN
    CREATE TRIGGER departments_set_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- Populate departments from legacy users.department column
INSERT INTO departments (name)
SELECT DISTINCT department
FROM users
WHERE department IS NOT NULL
  AND department <> ''
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- Users adjustments
-- ============================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Align user roles with new taxonomy
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'manager', 'employee'));

UPDATE users
SET role = 'employee'
WHERE role = 'user';

-- Backfill department_id from legacy column
UPDATE users u
SET department_id = d.id
FROM departments d
WHERE u.department_id IS NULL
  AND u.department = d.name;

-- ============================================================
-- Approvals table adjustments
-- ============================================================
CREATE TABLE IF NOT EXISTS approvals (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  approver_id INTEGER REFERENCES users(id),
  decision VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE approvals
  ADD COLUMN IF NOT EXISTS decision VARCHAR(20),
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE approvals
  ADD CONSTRAINT approvals_decision_check
  CHECK (decision IN ('pending', 'approved', 'rejected') OR decision IS NULL);

-- Ensure legacy status column aligns with decision column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'approvals' AND column_name = 'status'
  ) THEN
    UPDATE approvals
    SET decision = COALESCE(decision, status);
  END IF;
END;
$$;

-- ============================================================
-- Messages adjustments
-- ============================================================
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS sender_department_id INTEGER REFERENCES departments(id),
  ADD COLUMN IF NOT EXISTS receiver_department_id INTEGER REFERENCES departments(id),
  ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_status_check;
ALTER TABLE messages
  ADD CONSTRAINT messages_status_check
  CHECK (
    status IN (
      'draft',
      'pending_approval',
      'approved',
      'rejected',
      'sent',
      'received'
    )
  );

-- ============================================================
-- Audit logs adjustments
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action_type VARCHAR(100),
  entity_type VARCHAR(100) NOT NULL,
  entity_id INTEGER,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS action_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS metadata JSONB;

COMMIT;

