-- Таблица для хранения истории переходов статусов тикетов
CREATE TABLE IF NOT EXISTS ticket_status_history (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  from_status_id INTEGER REFERENCES states(id) ON DELETE SET NULL,
  to_status_id INTEGER NOT NULL REFERENCES states(id) ON DELETE SET NULL,
  changed_by INTEGER REFERENCES agents(id) ON DELETE SET NULL,
  transition_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  time_in_previous_status INTERVAL,
  action_label VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_ticket_status_history_ticket_id ON ticket_status_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_status_history_to_status_id ON ticket_status_history(to_status_id);
CREATE INDEX IF NOT EXISTS idx_ticket_status_history_transition_time ON ticket_status_history(transition_time);

-- Комментарии к полям
COMMENT ON TABLE ticket_status_history IS 'История переходов статусов тикетов';
COMMENT ON COLUMN ticket_status_history.ticket_id IS 'ID тикета';
COMMENT ON COLUMN ticket_status_history.from_status_id IS 'Исходный статус (NULL для начального статуса)';
COMMENT ON COLUMN ticket_status_history.to_status_id IS 'Новый статус';
COMMENT ON COLUMN ticket_status_history.changed_by IS 'Кто изменил статус';
COMMENT ON COLUMN ticket_status_history.transition_time IS 'Время перехода';
COMMENT ON COLUMN ticket_status_history.time_in_previous_status IS 'Время нахождения в предыдущем статусе';
COMMENT ON COLUMN ticket_status_history.action_label IS 'Метка действия (из workflow transition)';
