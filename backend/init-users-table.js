const { pool } = require('./config/db');
const bcrypt = require('bcryptjs');

async function initUsersTable() {
  try {
    console.log('🔄 Создание таблицы users...');

    // Создание таблицы
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        login VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Таблица users создана');

    // Создание индексов
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_login ON users(login)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)');

    console.log('✅ Индексы созданы');

    // Проверка существования тестового пользователя
    const existingUser = await pool.query('SELECT id FROM users WHERE login = $1', ['admin']);

    if (existingUser.rows.length === 0) {
      // Создание тестового пользователя
      const hashedPassword = await bcrypt.hash('admin', 10);
      
      await pool.query(`
        INSERT INTO users (login, password, first_name, last_name, email, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['admin', hashedPassword, 'Admin', 'User', 'admin@demo.com', true]);

      console.log('✅ Тестовый пользователь создан:');
      console.log('   Email: admin@demo.com');
      console.log('   Пароль: admin');
    } else {
      console.log('ℹ️  Тестовый пользователь уже существует');
      console.log('   Обновляем пароль и email...');
      
      // Обновляем существующего пользователя
      const hashedPassword = await bcrypt.hash('admin', 10);
      await pool.query(`
        UPDATE users
        SET password = $1, email = $2
        WHERE login = $3
      `, [hashedPassword, 'admin@demo.com', 'admin']);
      
      console.log('✅ Пользователь обновлен:');
      console.log('   Email: admin@demo.com');
      console.log('   Пароль: admin');
    }

    console.log('✅ Инициализация завершена успешно');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка инициализации:', error);
    process.exit(1);
  }
}

initUsersTable();
