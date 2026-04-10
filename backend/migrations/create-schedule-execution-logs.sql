-- Migration: Add schedule execution logs table
-- Created: 2026-04-09

CREATE TABLE IF NOT EXISTS schedule_execution_logs (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER REFERENCES ticket_schedules(id) ON DELETE CASCADE,
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  message TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_execution_logs_schedule_id ON schedule_execution_logs(schedule_id);

COMMENT ON TABLE schedule_execution_logs IS 'Логи выполнения расписаний тикетов';
COMMENT ON COLUMN schedule_execution_logs.schedule_id IS 'ID расписания';
COMMENT ON COLUMN schedule_execution_logs.ticket_id IS 'ID созданного тикета';
COMMENT ON COLUMN schedule_execution_logs.executed_at IS 'Время выполнения';
COMMENT ON COLUMN schedule_execution_logs.success IS 'Успешность выполнения';
COMMENT ON COLUMN schedule_execution_logs.message IS 'Сообщение';
COMMENT ON COLUMN schedule_execution_logs.error IS 'Ошибка';