-- Migration: Create tickets table
-- Created: 2026-02-12

CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    type_id INTEGER REFERENCES types(id) ON DELETE SET NULL,
    priority_id INTEGER REFERENCES priorities(id) ON DELETE SET NULL,
    queue_id INTEGER REFERENCES queues(id) ON DELETE SET NULL,
    state_id INTEGER REFERENCES states(id) ON DELETE SET NULL,
    owner_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
    company_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    sla_id INTEGER REFERENCES sla(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_title ON tickets(title);
CREATE INDEX IF NOT EXISTS idx_tickets_type_id ON tickets(type_id);
CREATE INDEX IF NOT EXISTS idx_tickets_priority_id ON tickets(priority_id);
CREATE INDEX IF NOT EXISTS idx_tickets_queue_id ON tickets(queue_id);
CREATE INDEX IF NOT EXISTS idx_tickets_state_id ON tickets(state_id);
CREATE INDEX IF NOT EXISTS idx_tickets_owner_id ON tickets(owner_id);
CREATE INDEX IF NOT EXISTS idx_tickets_company_id ON tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_sla_id ON tickets(sla_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_is_active ON tickets(is_active);

-- Comment on table
COMMENT ON TABLE tickets IS 'Тикеты системы поддержки';
COMMENT ON COLUMN tickets.ticket_number IS 'Номер тикета';
COMMENT ON COLUMN tickets.title IS 'Заголовок тикета';
COMMENT ON COLUMN tickets.type_id IS 'Тип тикета (ссылка на types)';
COMMENT ON COLUMN tickets.priority_id IS 'Приоритет (ссылка на priorities)';
COMMENT ON COLUMN tickets.queue_id IS 'Очередь (ссылка на queues)';
COMMENT ON COLUMN tickets.state_id IS 'Статус (ссылка на states)';
COMMENT ON COLUMN tickets.owner_id IS 'Владелец/создатель (ссылка на agents)';
COMMENT ON COLUMN tickets.company_id IS 'Компания (ссылка на customers)';
COMMENT ON COLUMN tickets.sla_id IS 'SLA (ссылка на sla)';
