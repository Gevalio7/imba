-- Миграция: добавление external_id для дедупликации писем (2026-05-27)
-- Требуется для MailFetcherService.findByExternalId

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS external_id VARCHAR(255);

-- Индекс для быстрого поиска (по message-id)
CREATE INDEX IF NOT EXISTS idx_tickets_external_id ON tickets(external_id);

COMMENT ON COLUMN tickets.external_id IS 'Message-ID входящего письма (для deduplication)';