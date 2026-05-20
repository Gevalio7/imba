const fs = require('node:fs')
const path = require('node:path')
const { pool } = require('./config/db')

async function applyMigration() {
  try {
    console.log('🔌 Проверка подключения к базе данных...')
    await pool.query('SELECT NOW()')
    console.log('✅ Подключение установлено')

    const migrationPath = path.join(__dirname, 'migrations', 'create-calendar-events-table.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('📄 Выполнение миграции...')
    await pool.query(sql)
    console.log('✅ Миграция выполнена успешно')
  }
  catch (error) {
    console.error('❌ Ошибка:', error.message)
  }
  finally {
    await pool.end()
  }
}

applyMigration()
