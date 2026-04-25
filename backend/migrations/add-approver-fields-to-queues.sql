-- Migration: Add approver fields to queues table
-- Created: 2026-04-24

ALTER TABLE queues ADD COLUMN IF NOT EXISTS approver_agent_ids INTEGER[] DEFAULT '{}';
ALTER TABLE queues ADD COLUMN IF NOT EXISTS approver_group_ids INTEGER[] DEFAULT '{}';

-- Comments
COMMENT ON COLUMN queues.approver_agent_ids IS 'ID агентов-согласующих';
COMMENT ON COLUMN queues.approver_group_ids IS 'ID групп-согласующих';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_queues_approver_agent_ids ON queues USING GIN(approver_agent_ids);
CREATE INDEX IF NOT EXISTS idx_queues_approver_group_ids ON queues USING GIN(approver_group_ids);