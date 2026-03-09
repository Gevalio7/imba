/**
 * Скрипт для поиска агентов, у которых есть роль, но нет группы
 * Это "хвосты" в БД, которые нужно удалить при переходе на новую архитектуру
 * где роли назначаются только через группы
 */

const { pool } = require('./config/db');

async function findAgentsWithRolesNoGroups() {
  try {
    console.log('Поиск агентов с ролями, но без групп...');
    
    // SQL-запрос для поиска агентов с ролями, но без групп
    const query = `
      SELECT
        a.id,
        a.first_name,
        a.last_name,
        a.login,
        a.email,
        a.role_id,
        r.name as role_name
      FROM
        agents a
      LEFT JOIN
        roles r ON a.role_id = r.id
      LEFT JOIN
        agents_groups_agents aga ON a.id = aga.agent_id
      WHERE
        a.role_id IS NOT NULL
        AND aga.agent_id IS NULL
      ORDER BY
        a.id
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('Агенты с ролями, но без групп не найдены.');
    } else {
      console.log(`Найдено ${result.rows.length} агентов с ролями, но без групп:`);
      console.table(result.rows);
    }
    
    return result.rows;
  } catch (error) {
    console.error('Ошибка при поиске агентов с ролями, но без групп:', error);
    throw error;
  } finally {
    // Не закрываем пул соединений, так как он может использоваться в других частях приложения
  }
}

// Запускаем функцию, если скрипт запущен напрямую
if (require.main === module) {
  findAgentsWithRolesNoGroups()
    .then(() => {
      console.log('Поиск завершен.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Ошибка при выполнении скрипта:', err);
      process.exit(1);
    });
} else {
  // Экспортируем функцию для использования в других модулях
  module.exports = { findAgentsWithRolesNoGroups };
}
