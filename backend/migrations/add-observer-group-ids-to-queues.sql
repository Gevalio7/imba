-- Migration: Add observer group ids to queues table
-- Created: 2026-04-27

ALTER TABLE queues ADD COLUMN IF NOT EXISTS observer_group_ids INTEGER[] DEFAULT '{}';

-- Comment
COMMENT ON COLUMN queues.observer_group_ids IS 'ID групп-наблюдателей';

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_queues_observer_group_ids ON queues USING GIN(observer_group_ids);