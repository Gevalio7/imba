-- Миграция для создания таблицы расписаний тикетов
-- Создает таблицу для хранения расписаний автоматического создания тикетов

CREATE TABLE IF NOT EXISTS ticket_schedules (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
  
  -- Тип расписания: daily, weekly, monthly
  schedule_type VARCHAR(20) NOT NULL DEFAULT 'daily',
  
  -- Время выполнения (часы и минуты в формате HH:MM)
  schedule_time VARCHAR(5) NOT NULL DEFAULT '09:00',
  
  -- Дни недели для weekly (массив: 1=Пн, 7=Вс)
  schedule_days INTEGER[],
  
  -- День месяца для monthly (1-31)
  schedule_day_of_month INTEGER,
  
  -- Дата начала действия расписания
  start_date DATE,
  
  -- Дата окончания действия расписания
  end_date DATE,
  
  -- Активно ли расписание
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Последний запуск
  last_run_at TIMESTAMP,
  
  -- Следующий запуск
  next_run_at TIMESTAMP,
  
  -- Связанные данные тикета (копия для создания новых тикетов)
  title VARCHAR(255),
  description TEXT,
  type_id INTEGER,
  category_id INTEGER,
  priority_id INTEGER,
  queue_id INTEGER,
  state_id INTEGER,
  owner_id INTEGER,
  executor_agent_ids INTEGER[],
  executor_group_ids INTEGER[],
  company_id INTEGER,
  service_id INTEGER,
  sla_id INTEGER,
  
  -- Метаданные
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_ticket_schedules_ticket_id ON ticket_schedules(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_schedules_is_active ON ticket_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_ticket_schedules_next_run_at ON ticket_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_ticket_schedules_active_next_run ON ticket_schedules(is_active, next_run_at) WHERE is_active = true;

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_ticket_schedules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ticket_schedules_updated_at ON ticket_schedules;
CREATE TRIGGER update_ticket_schedules_updated_at
  BEFORE UPDATE ON ticket_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_schedules_timestamp();
