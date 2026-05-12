import { pool } from './config/db.js';

async function updateMorozova() {
  try {
    // Проверить текущую БД
    const db = await pool.query('SELECT current_database()');
    console.log('Current database:', db.rows[0].current_database);

    // Проверить таблицы
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables:', tables.rows.map(r => r.table_name));

    // Проверить схему roles
    const schema = await pool.query("SELECT table_schema FROM information_schema.tables WHERE table_name = 'roles'");
    console.log('Schema for roles:', schema.rows);

    // Проверить колонки roles
    const columns = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'roles'");
    console.log('Columns in roles:', columns.rows.map(r => r.column_name));

    // Проверить данные roles
    const rolesData = await pool.query('SELECT * FROM roles LIMIT 5');
    console.log('Roles data:', rolesData.rows);

    // Проверить users
    const usersData = await pool.query('SELECT * FROM users LIMIT 5');
    console.log('Users:', usersData.rows);

    // Hardcode adminRoleId = 2 (Менеджер -> Администратор)
    const adminRoleId = 2;

    // Найти пользователя Морозова
    const userRes = await pool.query(`SELECT id FROM users WHERE first_name = 'Ольга' AND last_name = 'Морозова'`);
    if (userRes.rows.length === 0) {
      console.log('Пользователь Морозова не найден');
      return;
    }
    const userId = userRes.rows[0].id;

    // Обновить user_roles
    await pool.query(`UPDATE user_roles SET role_id = ${adminRoleId} WHERE user_id = ${userId}`);
    console.log('Роль Морозовой обновлена на Администратор');
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    pool.end();
  }
}

updateMorozova();