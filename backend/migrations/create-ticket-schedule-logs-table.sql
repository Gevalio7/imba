-- Миграция для создания таблицы истории выполнения расписаний
-- Хранит историю запусков расписаний и созданные тикеты

CREATE TABLE IF NOT EXISTS ticket_schedule_logs (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER REFERENCES ticket_schedules(id) ON DELETE CASCADE,
  
  -- Время выполнения
  executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- ID созданного тикета (если создан)
  created_ticket_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
  
  -- Номер созданного тикета (дублируем для быстрого доступа)
  created_ticket_number VARCHAR(50),
  
  -- Статус выполнения: success, error, skipped
  status VARCHAR(20) NOT NULL,
  
  -- Сообщение об ошибке (если есть)
  error_message TEXT,
  
  -- Дополнительная информация
  details JSONB,
  
  -- Метаданные
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_ticket_schedule_logs_schedule_id ON ticket_schedule_logs(schedule_id);
CREATE INDEX IF NOT EXISTS idx_ticket_schedule_logs_executed_at ON ticket_schedule_logs(executed_at);
CREATE INDEX IF NOT EXISTS idx_ticket_schedule_logs_status ON ticket_schedule_logs(status);