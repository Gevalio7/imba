/**
 * Скрипт для проверки структуры таблицы agents_groups_agents
 */

const { pool } = require('./config/db');

async function checkAgentsGroupsAgentsTable() {
  try {
    console.log('Проверка структуры таблицы agents_groups_agents...');
    
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'agents_groups_agents'
      ORDER BY ordinal_position
    `);
    
    console.log('Структура таблицы agents_groups_agents:');
    console.table(result.rows);
    
    return result.rows;
  } catch (error) {
    console.error('Ошибка при проверке структуры таблицы agents_groups_agents:', error);
    throw error;
  } finally {
    // Закрываем пул соединений
    await pool.end();
  }
}

// Запускаем функцию
checkAgentsGroupsAgentsTable()
  .then(() => {
    console.log('Проверка завершена.');
  })
  .catch(err => {
    console.error('Ошибка при выполнении скрипта:', err);
    process.exit(1);
  });
