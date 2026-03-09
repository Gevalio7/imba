/**
 * Скрипт для проверки структуры таблицы agents
 */

const { pool } = require('./config/db');

async function checkAgentsTableStructure() {
  try {
    console.log('Проверка структуры таблицы agents...');
    
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'agents'
      ORDER BY ordinal_position
    `);
    
    console.log('Структура таблицы agents:');
    console.table(result.rows);
    
    return result.rows;
  } catch (error) {
    console.error('Ошибка при проверке структуры таблицы agents:', error);
    throw error;
  } finally {
    // Закрываем пул соединений
    await pool.end();
  }
}

// Запускаем функцию
checkAgentsTableStructure()
  .then(() => {
    console.log('Проверка завершена.');
  })
  .catch(err => {
    console.error('Ошибка при выполнении скрипта:', err);
    process.exit(1);
  });
