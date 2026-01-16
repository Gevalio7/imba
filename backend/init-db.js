const { Pool } = require('pg');

const masterPool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
});

const dbName = 'test_entities_db';

async function initializeDatabase() {
  try {
    console.log('Attempting to connect to master database...');
    // Подключение к postgres
    const client = await masterPool.connect();
    console.log('Connected to master database.');

    // Проверка существования базы данных
    const result = await client.query(`SELECT datname FROM pg_database WHERE datname = $1`, [dbName]);
    if (result.rows.length === 0) {
      console.log(`База данных ${dbName} не существует. Создание...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`База данных ${dbName} создана.`);
    } else {
      console.log(`База данных ${dbName} уже существует.`);
    }

    client.release();
    await masterPool.end();
    console.log('Master pool ended.');

    // Подключение к test_entities_db
    console.log('Loading config/db.js...');
    const { pool } = require('./config/db');
    console.log('Config loaded, attempting to connect to test_entities_db...');

    // Создание таблицы
    console.log('Creating table test_entities...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_entities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        comment TEXT
      )
    `);
    console.log('Таблица test_entities создана или уже существует.');

    // Проверка, есть ли данные
    const countResult = await pool.query('SELECT COUNT(*) as count FROM test_entities');
    const count = parseInt(countResult.rows[0].count);

    if (count === 0) {
      // Вставка начальных данных
      const initialData = [
        { name: 'Entity One', comment: 'This is the first test entity.' },
        { name: 'Entity Two', comment: 'Second entity with a comment.' },
        { name: 'Entity Three', comment: 'Third entity for testing.' },
        { name: 'Entity Four', comment: 'Another test entity.' },
        { name: 'Entity Five', comment: 'Fifth entity in the list.' },
      ];

      for (const entity of initialData) {
        await pool.query('INSERT INTO test_entities (name, comment) VALUES ($1, $2)', [entity.name, entity.comment]);
      }
      console.log('Начальные данные вставлены.');
    } else {
      console.log('Начальные данные уже существуют.');
    }

    await pool.end();
  } catch (err) {
    console.error('Ошибка инициализации базы данных:', err);
  }
}

module.exports = { initializeDatabase };
