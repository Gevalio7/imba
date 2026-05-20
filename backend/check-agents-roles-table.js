/**
 * Скрипт для проверки структуры таблицы agents_roles
 */

const { pool } = require('./config/db')

async function checkAgentsRolesTable() {
  try {
    console.log('Проверка структуры таблицы agents_roles...')

    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'agents_roles'
      ORDER BY ordinal_position
    `)

    console.log('Структура таблицы agents_roles:')
    console.table(result.rows)

    return result.rows
  }
  catch (error) {
    console.error('Ошибка при проверке структуры таблицы agents_roles:', error)
    throw error
  }
  finally {
    // Закрываем пул соединений
    await pool.end()
  }
}

// Запускаем функцию
checkAgentsRolesTable()
  .then(() => {
    console.log('Проверка завершена.')
  })
  .catch(err => {
    console.error('Ошибка при выполнении скрипта:', err)
    process.exit(1)
  })
