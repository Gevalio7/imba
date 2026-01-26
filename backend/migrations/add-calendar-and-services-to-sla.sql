-- Добавить calendar_id в таблицу sla
ALTER TABLE sla ADD COLUMN calendar_id INTEGER REFERENCES calendars(id);

-- Создать таблицу sla_services для связи many-to-many
CREATE TABLE IF NOT EXISTS sla_services (
  id SERIAL PRIMARY KEY,
  sla_id INTEGER NOT NULL REFERENCES sla(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sla_id, service_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_sla_services_sla_id ON sla_services(sla_id);
CREATE INDEX IF NOT EXISTS idx_sla_services_service_id ON sla_services(service_id);

-- Триггер для updated_at
CREATE OR REPLACE FUNCTION update_sla_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sla_services_updated_at ON sla_services;
CREATE TRIGGER trigger_update_sla_services_updated_at
  BEFORE UPDATE ON sla_services
  FOR EACH ROW
  EXECUTE FUNCTION update_sla_services_updated_at();
