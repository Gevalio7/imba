-- Создание таблицы связи между компаниями и сервисами
-- Многие ко многим: одна компания может иметь много сервисов, один сервис может быть у многих компаний

CREATE TABLE IF NOT EXISTS customers_services (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, service_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_customers_services_customer_id ON customers_services(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_services_service_id ON customers_services(service_id);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_customers_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_customers_services_updated_at
    BEFORE UPDATE ON customers_services
    FOR EACH ROW
    EXECUTE FUNCTION update_customers_services_updated_at();

COMMENT ON TABLE customers_services IS 'Таблица связи между компаниями и сервисами';
COMMENT ON COLUMN customers_services.customer_id IS 'ID компании';
COMMENT ON COLUMN customers_services.service_id IS 'ID сервиса';
