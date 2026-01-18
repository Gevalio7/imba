import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const masterPool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
});

const dbName = 'test_entities_db';

// Функция для преобразования типа из конфига в SQL тип
function mapTypeToSql(type: string): string {
  if (type.includes('string')) return 'VARCHAR(255)';
  if (type.includes('number')) return 'INTEGER';
  if (type.includes('boolean')) return 'BOOLEAN';
  if (type.includes('string[]')) return 'TEXT[]';
  return 'TEXT';
}

// Функция для создания таблицы на основе конфига
async function createTableFromConfig(pool: Pool, tableName: string, config: any): Promise<void> {
  const columns = ['id SERIAL PRIMARY KEY'];

  if (Array.isArray(config)) {
    // Простой массив полей
    config.forEach(field => {
      columns.push(`${field} VARCHAR(255)`);
    });
  } else {
    // Объект с типами
    Object.entries(config).forEach(([field, type]) => {
      const sqlType = mapTypeToSql(type as string);
      columns.push(`${field} ${sqlType}`);
    });
  }

  // Добавляем стандартные поля
  columns.push('created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  columns.push('updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  columns.push('status INTEGER DEFAULT 1');
  columns.push('is_active BOOLEAN DEFAULT true');

  const createQuery = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      ${columns.join(',\n      ')}
    )
  `;

  await pool.query(createQuery);
  console.log(`Таблица ${tableName} создана или уже существует.`);
}

// Функция для вставки начальных данных
async function insertInitialData(pool: Pool, tableName: string, config: any): Promise<void> {
  const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
  const count = parseInt(countResult.rows[0].count);

  if (count > 0) {
    console.log(`Начальные данные для ${tableName} уже существуют.`);
    return;
  }

  let initialData: any[] = [];

  // Специальная логика для разных таблиц
  if (tableName === 'priorities') {
    initialData = [
      { name: 'Низкий', color: '#28a745', status: 1, is_active: true },
      { name: 'Средний', color: '#ffc107', status: 1, is_active: true },
      { name: 'Высокий', color: '#dc3545', status: 1, is_active: true },
      { name: 'Критический', color: '#6f42c1', status: 1, is_active: true },
    ];
  } else if (tableName === 'greetings') {
    initialData = [
      { name: 'Приветствие 1', description: 'Добро пожаловать в систему!', status: 1, is_active: true },
      { name: 'Приветствие 2', description: 'Спасибо за использование нашего сервиса.', status: 1, is_active: true },
      { name: 'Приветствие 3', description: 'Мы рады помочь вам.', status: 1, is_active: true },
    ];
  } else if (tableName === 'types') {
    initialData = [
      { name: 'Тип 1', description: 'Описание типа 1', status: 1, is_active: true },
      { name: 'Тип 2', description: 'Описание типа 2', status: 1, is_active: true },
      { name: 'Тип 3', description: 'Описание типа 3', status: 1, is_active: true },
    ];
  } else {
    // Общие начальные данные
    initialData = [
      { name: `${tableName} Item 1`, description: `Description for ${tableName} item 1`, status: 1, is_active: true },
      { name: `${tableName} Item 2`, description: `Description for ${tableName} item 2`, status: 1, is_active: true },
      { name: `${tableName} Item 3`, description: `Description for ${tableName} item 3`, status: 1, is_active: true },
    ];
  }

  for (const item of initialData) {
    const fields = Object.keys(item);
    const values = Object.values(item);
    const placeholders = fields.map((_, i) => `$${i + 1}`);

    const insertQuery = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
    await pool.query(insertQuery, values);
  }

  console.log(`Начальные данные для ${tableName} вставлены.`);
}

async function initializeDatabase(): Promise<void> {
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

    // Загрузка конфига сущностей
    const configPath = path.join(__dirname, 'entities-config.json');
    const entitiesConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // Создание таблиц на основе конфига
    for (const [entityName, config] of Object.entries(entitiesConfig)) {
      const tableName = entityName.toLowerCase();
      console.log(`Creating table ${tableName}...`);
      await createTableFromConfig(pool, tableName, config);
      await insertInitialData(pool, tableName, config);
    }

    console.log('Инициализация базы данных завершена успешно.');
  } catch (err) {
    console.error('Ошибка инициализации базы данных:', err);
    throw err;
  }
}

export { initializeDatabase };
