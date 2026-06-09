/**
 * Миграция: Шифрование существующих паролей в post_master_mail_accounts
 * 
 * Запуск: node backend/scripts/encrypt-existing-passwords.js
 * 
 * ВНИМАНИЕ: Перед запуском убедитесь, что:
 * 1. Установлен MAIL_PASSWORD_ENCRYPTION_KEY в .env
 * 2. Сделан бэкап БД
 * 3. Приложение остановлено (чтобы не было гонок)
 */

const { pool } = require('../config/db')
const { encrypt } = require('../utils/crypto')

async function migratePasswords() {
  console.log('[MIGRATE] Starting password encryption migration...')

  // Получаем все аккаунты с паролями
  const result = await pool.query(
    'SELECT id, password, smtp_password FROM post_master_mail_accounts WHERE password IS NOT NULL OR smtp_password IS NOT NULL'
  )

  console.log(`[MIGRATE] Found ${result.rows.length} accounts with passwords`)

  let encryptedCount = 0

  for (const account of result.rows) {
    const updates = {}
    const hasUpdates = {}

    // Проверяем пароль (IMAP)
    if (account.password && account.password.length < 100) {
      // Короткие строки обычно не зашифрованы (зашифрованный base64 будет длиннее)
      updates.password = encrypt(account.password)
      hasUpdates.password = true
      console.log(`[MIGRATE] Account ${account.id}: IMAP password will be encrypted`)
    }

    // Проверяем SMTP пароль
    if (account.smtp_password && account.smtp_password.length < 100) {
      updates.smtp_password = encrypt(account.smtp_password)
      hasUpdates.smtp_password = true
      console.log(`[MIGRATE] Account ${account.id}: SMTP password will be encrypted`)
    }

    if (Object.keys(updates).length > 0) {
      const setClauses = Object.keys(updates).map((key, idx) => `${key} = $${idx + 1}`)
      const values = [...Object.values(updates), account.id]

      await pool.query(
        `UPDATE post_master_mail_accounts SET ${setClauses.join(', ')} WHERE id = $${values.length}`,
        values
      )
      encryptedCount++
    }
  }

  console.log(`[MIGRATE] Migration complete. Encrypted ${encryptedCount} accounts.`)
  await pool.end()
}

migratePasswords().catch(err => {
  console.error('[MIGRATE] Error:', err)
  process.exit(1)
})