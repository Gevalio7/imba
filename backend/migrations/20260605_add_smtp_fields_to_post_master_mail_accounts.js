const { pool } = require('../config/db')

async function up() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Проверяем, существуют ли уже поля
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'post_master_mail_accounts' 
      AND column_name IN ('smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_password', 'smtp_from_email', 'smtp_from_name', 'use_for_outgoing')
    `)

    const existingColumns = checkResult.rows.map(r => r.column_name)

    const queries = []

    if (!existingColumns.includes('smtp_host')) {
      queries.push(`ALTER TABLE post_master_mail_accounts ADD COLUMN smtp_host VARCHAR(255)`)
    }
    if (!existingColumns.includes('smtp_port')) {
      queries.push(`ALTER TABLE post_master_mail_accounts ADD COLUMN smtp_port INTEGER`)
    }
    if (!existingColumns.includes('smtp_secure')) {
      queries.push(`ALTER TABLE post_master_mail_accounts ADD COLUMN smtp_secure BOOLEAN DEFAULT false`)
    }
    if (!existingColumns.includes('smtp_user')) {
      queries.push(`ALTER TABLE post_master_mail_accounts ADD COLUMN smtp_user VARCHAR(255)`)
    }
    if (!existingColumns.includes('smtp_password')) {
      queries.push(`ALTER TABLE post_master_mail_accounts ADD COLUMN smtp_password TEXT`)
    }
    if (!existingColumns.includes('smtp_from_email')) {
      queries.push(`ALTER TABLE post_master_mail_accounts ADD COLUMN smtp_from_email VARCHAR(255)`)
    }
    if (!existingColumns.includes('smtp_from_name')) {
      queries.push(`ALTER TABLE post_master_mail_accounts ADD COLUMN smtp_from_name VARCHAR(255)`)
    }
    if (!existingColumns.includes('use_for_outgoing')) {
      queries.push(`ALTER TABLE post_master_mail_accounts ADD COLUMN use_for_outgoing BOOLEAN DEFAULT false`)
    }

    // Добавляем индекс для external_id (для быстрого поиска по messageId)
    const indexCheck = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'tickets' AND indexdef ILIKE '%external_id%'
    `)
    if (indexCheck.rows.length === 0) {
      queries.push(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_external_id ON tickets(external_id)`)
    }

    // Добавляем индекс для mail_fetch_logs
    const logsIndexCheck = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'mail_fetch_logs' AND indexdef ILIKE '%mail_account_id%'
    `)
    if (logsIndexCheck.rows.length === 0) {
      queries.push(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mail_fetch_logs_account ON mail_fetch_logs(mail_account_id, started_at DESC)`)
    }

    for (const query of queries) {
      console.log('[MIGRATION] Executing:', query)
      await client.query(query)
    }

    await client.query('COMMIT')
    console.log('[MIGRATION] SMTP fields migration completed successfully')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('[MIGRATION] Error:', error)
    throw error
  } finally {
    client.release()
  }
}

module.exports = { up }