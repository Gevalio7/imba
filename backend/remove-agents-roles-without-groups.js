/**
 * Скрипт для удаления ролей у агентов, которые не состоят в группах
 * Это часть перехода на новую архитектуру, где роли назначаются только через группы
 */

const { pool } = require('./config/db');
const { findAgentsWithRolesNoGroups } = require('./find-agents-with-roles-no-groups');

async function removeRolesFromAgentsWithoutGroups() {
  try {
    console.log('Начинаем удаление агентов без групп...');
    
    // Сначала находим всех агентов с ролями, но без групп
    const agentsWithRolesNoGroups = await findAgentsWithRolesNoGroups();
    
    if (agentsWithRolesNoGroups.length === 0) {
      console.log('Нет агентов без групп. Удаление не требуется.');
      return { success: true, message: 'Нет агентов без групп', affectedAgents: [] };
    }
    
    console.log(`Найдено ${agentsWithRolesNoGroups.length} агентов без групп. Удаляем агентов...`);
    
    // Создаем массив ID агентов для удаления ролей
    const agentIds = agentsWithRolesNoGroups.map(agent => agent.id);
    
    // SQL-запрос для обнуления ролей у агентов без групп
    const query = `
      UPDATE agents
      SET role_id = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($1::int[])
      RETURNING id, first_name, last_name, login, email
    `;
    
    const result = await pool.query(query, [agentIds]);
    
    console.log(`Успешно удалены роли у ${result.rows.length} агентов:`);
    console.table(result.rows);
    
    return { 
      success: true, 
      message: `Успешно удалены роли у ${result.rows.length} агентов`, 
      affectedAgents: result.rows 
    };
  } catch (error) {
    console.error('Ошибка при удалении ролей у агентов без групп:', error);
    return { 
      success: false, 
      message: `Ошибка при удалении ролей: ${error.message}`, 
      error 
    };
  } finally {
    // Не закрываем пул соединений, так как он может использоваться в других частях приложения
  }
}

// Запускаем функцию, если скрипт запущен напрямую
if (require.main === module) {
  removeRolesFromAgentsWithoutGroups()
    .then(result => {
      console.log('Результат операции:', result.message);
      process.exit(0);
    })
    .catch(err => {
      console.error('Ошибка при выполнении скрипта:', err);
      process.exit(1);
    });
} else {
  // Экспортируем функцию для использования в других модулях
  module.exports = { removeRolesFromAgentsWithoutGroups };
}
