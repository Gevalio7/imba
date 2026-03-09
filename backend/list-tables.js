/**
 * Скрипт для получения списка всех таблиц в базе данных
 */

const { pool } = require('./config/db');

async function listTables() {
  try {
    console.log('Получение списка таблиц...');
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Таблицы в базе данных:');
    console.table(result.rows);
    
    return result.rows;
  } catch (error) {
    console.error('Ошибка при получении списка таблиц:', error);
    throw error;
  } finally {
    // Закрываем пул соединений
    await pool.end();
  }
}

// Запускаем функцию
listTables()
  .then(() => {
    console.log('Получение списка таблиц завершено.');
  })
  .catch(err => {
    console.error('Ошибка при выполнении скрипта:', err);
    process.exit(1);
  });
