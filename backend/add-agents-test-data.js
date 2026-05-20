const { pool } = require('./config/db')

async function addAgentsTestData() {
  try {
    console.log('🔄 Добавление тестовых данных агентов...')

    // Тестовые агенты
    const agents = [
      {
        first_name: 'Иван',
        last_name: 'Иванов',
        login: 'ivanov',
        password: 'password123',
        email: 'ivanov@example.com',
        mobile_phone: '+7 (999) 123-45-67',
        telegram_account: '@ivanov_agent',
        is_active: true,
      },
      {
        first_name: 'Мария',
        last_name: 'Петрова',
        login: 'petrova',
        password: 'password123',
        email: 'petrova@example.com',
        mobile_phone: '+7 (999) 234-56-78',
        telegram_account: '@petrova_agent',
        is_active: true,
      },
      {
        first_name: 'Алексей',
        last_name: 'Сидоров',
        login: 'sidorov',
        password: 'password123',
        email: 'sidorov@example.com',
        mobile_phone: '+7 (999) 345-67-89',
        telegram_account: '@sidorov_agent',
        is_active: true,
      },
      {
        first_name: 'Елена',
        last_name: 'Кузнецова',
        login: 'kuznetsova',
        password: 'password123',
        email: 'kuznetsova@example.com',
        mobile_phone: '+7 (999) 456-78-90',
        telegram_account: '@kuznetsova_agent',
        is_active: true,
      },
      {
        first_name: 'Дмитрий',
        last_name: 'Васильев',
        login: 'vasilev',
        password: 'password123',
        email: 'vasilev@example.com',
        mobile_phone: '+7 (999) 567-89-01',
        telegram_account: '@vasilev_agent',
        is_active: true,
      },
      {
        first_name: 'Ольга',
        last_name: 'Морозова',
        login: 'morozova',
        password: 'password123',
        email: 'morozova@example.com',
        mobile_phone: '+7 (999) 678-90-12',
        telegram_account: '@morozova_agent',
        is_active: false,
      },
      {
        first_name: 'Андрей',
        last_name: 'Новиков',
        login: 'novikov',
        password: 'password123',
        email: 'novikov@example.com',
        mobile_phone: '+7 (999) 789-01-23',
        telegram_account: '@novikov_agent',
        is_active: true,
      },
      {
        first_name: 'Татьяна',
        last_name: 'Федорова',
        login: 'fedorova',
        password: 'password123',
        email: 'fedorova@example.com',
        mobile_phone: '+7 (999) 890-12-34',
        telegram_account: '@fedorova_agent',
        is_active: true,
      },
    ]

    for (const agent of agents) {
      await pool.query(`INSERT INTO agents (first_name, last_name, login, password, email, mobile_phone, telegram_account, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (login) DO NOTHING`,
      [agent.first_name, agent.last_name, agent.login, agent.password, agent.email, agent.mobile_phone, agent.telegram_account, agent.is_active],
      )
    }

    console.log('✅ Добавлены тестовые агенты')
    console.log('✅ Все тестовые данные агентов добавлены успешно')
    process.exit(0)
  }
  catch (err) {
    console.error('❌ Ошибка:', err)
    process.exit(1)
  }
}

addAgentsTestData()
