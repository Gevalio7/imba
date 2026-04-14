-- Migration: Add template fields to queues table
-- Date: 2026-04-14
-- Description: Adds template fields for different ticket operations to the queues table

ALTER TABLE queues ADD COLUMN IF NOT EXISTS template_open_ticket_id INTEGER REFERENCES templates(id) ON DELETE SET NULL;
ALTER TABLE queues ADD COLUMN IF NOT EXISTS template_close_ticket_id INTEGER REFERENCES templates(id) ON DELETE SET NULL;
ALTER TABLE queues ADD COLUMN IF NOT EXISTS template_confirm_ticket_id INTEGER REFERENCES templates(id) ON DELETE SET NULL;
ALTER TABLE queues ADD COLUMN IF NOT EXISTS template_status_change_id INTEGER REFERENCES templates(id) ON DELETE SET NULL;
ALTER TABLE queues ADD COLUMN IF NOT EXISTS template_comment_ticket_id INTEGER REFERENCES templates(id) ON DELETE SET NULL;