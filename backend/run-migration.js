const fs = require('fs');
const path = require('path');
const { pool } = require('./config/db');

async function runMigration() {
  const migrationPath = path.join(__dirname, 'migrations', 'add-name-column-to-post-master-mail-accounts.sql');

  try {
    console.log('🚀 Запуск миграции: add-escalation-fields-to-tickets.sql');

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 SQL для выполнения:', sql);

    await pool.query(sql);
    console.log('✅ Миграция выполнена успешно');

  } catch (error) {
    console.error('❌ Ошибка выполнения миграции:', error);
  } finally {
    await pool.end();
  }
}

runMigration();