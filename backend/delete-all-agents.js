/**
 * Скрипт для удаления всех агентов из базы данных
 */

const { pool } = require('./config/db');

async function deleteAllAgents() {
  try {
    console.log('Удаление всех агентов из базы данных...');
    
    // Сначала удаляем связи агентов с группами
    const deleteRelationsQuery = `
      DELETE FROM agents_groups_agents
    `;
    
    const relationsResult = await pool.query(deleteRelationsQuery);
    console.log(`Удалено ${relationsResult.rowCount} связей агентов с группами`);
    
    // Затем удаляем всех агентов
    const deleteAgentsQuery = `
      DELETE FROM agents
    `;
    
    const agentsResult = await pool.query(deleteAgentsQuery);
    console.log(`Удалено ${agentsResult.rowCount} агентов`);
    
    return {
      success: true,
      deletedAgents: agentsResult.rowCount,
      deletedRelations: relationsResult.rowCount
    };
  } catch (error) {
    console.error('Ошибка при удалении агентов:', error);
    throw error;
  } finally {
    // Закрываем пул соединений
    await pool.end();
  }
}

// Запускаем функцию
deleteAllAgents()
  .then(result => {
    console.log('Удаление агентов завершено успешно.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Ошибка при выполнении скрипта:', err);
    process.exit(1);
  });
