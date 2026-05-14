-- Migration: Add userId column to session_management table
ALTER TABLE session_management ADD COLUMN user_id INTEGER;

-- Add index for user_id
CREATE INDEX IF NOT EXISTS idx_session_management_user_id ON session_management(user_id);

-- Add foreign key constraint if needed (assuming users table exists)
-- ALTER TABLE session_management ADD CONSTRAINT fk_session_management_user_id FOREIGN KEY (user_id) REFERENCES users(id);