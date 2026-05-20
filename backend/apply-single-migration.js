const fs = require('node:fs')
const path = require('node:path')
const { pool } = require('./config/db')

async function applyMigration() {
  try {
    console.log('🔌 Проверка подключения к базе данных...')
    await pool.query('SELECT NOW()')
    console.log('✅ Подключение установлено')

    const migrationName = process.argv[2]
    if (!migrationName) {
      console.error('❌ Укажите имя миграции: node apply-single-migration.js <migration-file.sql>')
      process.exit(1)
    }

    const migrationPath = path.join(__dirname, 'migrations', migrationName)
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log(`📄 Выполнение миграции ${migrationName}...`)
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
