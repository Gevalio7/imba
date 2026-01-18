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

    // Создание таблицы priorities
    console.log('Creating table priorities...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS priorities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(7) DEFAULT '#000000',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true
      )
    `);
    console.log('Таблица priorities создана или уже существует.');

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

    // Проверка, есть ли данные в priorities
    const prioritiesCountResult = await pool.query('SELECT COUNT(*) as count FROM priorities');
    const prioritiesCount = parseInt(prioritiesCountResult.rows[0].count);

    if (prioritiesCount === 0) {
      // Вставка начальных данных для priorities
      const initialPriorities = [
        { name: 'Низкий', color: '#28a745', status: 1, is_active: true },
        { name: 'Средний', color: '#ffc107', status: 1, is_active: true },
        { name: 'Высокий', color: '#dc3545', status: 1, is_active: true },
        { name: 'Критический', color: '#6f42c1', status: 1, is_active: true },
      ];

      for (const priority of initialPriorities) {
        await pool.query('INSERT INTO priorities (name, color, status, is_active) VALUES ($1, $2, $3, $4)', [priority.name, priority.color, priority.status, priority.is_active]);
      }
      console.log('Начальные данные для priorities вставлены.');
    } else {
      console.log('Начальные данные для priorities уже существуют.');
    }

    // Удаление таблицы types, если существует
    console.log('Dropping table types if exists...');
    await pool.query(`DROP TABLE IF EXISTS types`);
    console.log('Таблица types удалена.');

    // Создание таблиц для остальных сущностей
    const entities = [
      'acls', 'admin_notifications', 'agents', 'agents_groups', 'agents_roles', 'appointment_notifications',
      'attachments', 'calendars', 'communication_log', 'communication_notifications_settings',
      'customers', 'customers_groups', 'customer_users', 'customer_users_customers', 'customer_users_groups',
      'customer_users_services', 'dynamic_fields', 'dynamic_fields_screens', 'email_addresses',
      'general_catalog', 'generic_agent', 'greetings', 'groups', 'oauth2', 'package_manager',
      'performance_log', 'pgp_keys', 'post_master_filters', 'post_master_mail_accounts',
      'processes_automation_settings', 'process_management', 'queue_auto_response', 'queues',
      'roles', 'roles_groups', 'services', 'session_management', 'signatures', 'sla',
      'smime_certificates', 'sql_box', 'states', 'types', 'system_configuration', 'system_file_support',
      'system_log', 'system_maintenance', 'template_attachments', 'template_queues', 'templates',
      'ticket_attribute_relations', 'ticket_notifications', 'translation', 'users_groups_roles_settings',
      'web_services'
    ];

    for (const table of entities) {
      console.log(`Creating table ${table}...`);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${table} (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255),
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status INTEGER DEFAULT 1,
          is_active BOOLEAN DEFAULT true
        )
      `);
      console.log(`Таблица ${table} создана или уже существует.`);

      // Проверка, есть ли данные
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = parseInt(countResult.rows[0].count);

      if (count === 0) {
        // Вставка начальных данных
        const initialData = [
          { name: `${table} Item 1`, description: `Description for ${table} item 1`, status: 1, is_active: true },
          { name: `${table} Item 2`, description: `Description for ${table} item 2`, status: 1, is_active: true },
          { name: `${table} Item 3`, description: `Description for ${table} item 3`, status: 1, is_active: true },
        ];

        for (const item of initialData) {
          await pool.query(`INSERT INTO ${table} (name, description, status, is_active) VALUES ($1, $2, $3, $4)`, [item.name, item.description, item.status, item.is_active]);
        }
        console.log(`Начальные данные для ${table} вставлены.`);
      } else {
        console.log(`Начальные данные для ${table} уже существуют.`);
      }
    }
  } catch (err) {
    console.error('Ошибка инициализации базы данных:', err);
  }
}

module.exports = { initializeDatabase };
