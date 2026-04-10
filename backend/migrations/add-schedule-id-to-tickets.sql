-- Migration: Add created_by_schedule_id to tickets table
-- Created: 2026-04-09

ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS created_by_schedule_id INTEGER REFERENCES ticket_schedules(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tickets_created_by_schedule_id ON tickets(created_by_schedule_id);

-- Add comment
COMMENT ON COLUMN tickets.created_by_schedule_id IS 'ID расписания, по которому был создан тикет';