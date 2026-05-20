const { pool } = require('./config/db')

async function addAgentGroupsTestData() {
  try {
    console.log('🔄 Добавление тестовых групп агентов...')

    // Agents Groups
    await pool.query(`INSERT INTO agents_groups (name, is_active) VALUES
      ('Первая линия поддержки', true),
      ('Вторая линия поддержки', true),
      ('Отдел продаж', true),
      ('Технические специалисты', true),
      ('Менеджеры проектов', true)
      ON CONFLICT DO NOTHING`)
    console.log('✅ Добавлены тестовые группы агентов')

    console.log('✅ Все тестовые группы агентов добавлены успешно')
    process.exit(0)
  }
  catch (err) {
    console.error('❌ Ошибка:', err)
    process.exit(1)
  }
}

addAgentGroupsTestData()
