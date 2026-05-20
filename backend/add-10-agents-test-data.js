const { pool } = require('./config/db')

async function add10AgentsTestData() {
  try {
    console.log('🔄 Добавление 10 тестовых агентов...')

    // 10 новых тестовых агентов
    const agents = [
      {
        first_name: 'Сергей',
        last_name: 'Попов',
        login: 'popov',
        password: 'password123',
        email: 'popov@example.com',
        mobile_phone: '+7 (999) 111-11-11',
        telegram_account: '@popov_agent',
        is_active: true,
      },
      {
        first_name: 'Анна',
        last_name: 'Соколова',
        login: 'sokolova',
        password: 'password123',
        email: 'sokolova@example.com',
        mobile_phone: '+7 (999) 222-22-22',
        telegram_account: '@sokolova_agent',
        is_active: true,
      },
      {
        first_name: 'Михаил',
        last_name: 'Лебедев',
        login: 'lebedev',
        password: 'password123',
        email: 'lebedev@example.com',
        mobile_phone: '+7 (999) 333-33-33',
        telegram_account: '@lebedev_agent',
        is_active: true,
      },
      {
        first_name: 'Виктория',
        last_name: 'Козлова',
        login: 'kozlova',
        password: 'password123',
        email: 'kozlova@example.com',
        mobile_phone: '+7 (999) 444-44-44',
        telegram_account: '@kozlova_agent',
        is_active: true,
      },
      {
        first_name: 'Николай',
        last_name: 'Новиков',
        login: 'novikov_n',
        password: 'password123',
        email: 'novikov_n@example.com',
        mobile_phone: '+7 (999) 555-55-55',
        telegram_account: '@novikov_n_agent',
        is_active: true,
      },
      {
        first_name: 'Кристина',
        last_name: 'Волкова',
        login: 'volkova',
        password: 'password123',
        email: 'volkova@example.com',
        mobile_phone: '+7 (999) 666-66-66',
        telegram_account: '@volkova_agent',
        is_active: false,
      },
      {
        first_name: 'Павел',
        last_name: 'Соловьев',
        login: 'soloviev',
        password: 'password123',
        email: 'soloviev@example.com',
        mobile_phone: '+7 (999) 777-77-77',
        telegram_account: '@soloviev_agent',
        is_active: true,
      },
      {
        first_name: 'Юлия',
        last_name: 'Васильева',
        login: 'vasilieva_y',
        password: 'password123',
        email: 'vasilieva_y@example.com',
        mobile_phone: '+7 (999) 888-88-88',
        telegram_account: '@vasilieva_y_agent',
        is_active: true,
      },
      {
        first_name: 'Артем',
        last_name: 'Зайцев',
        login: 'zaitsev',
        password: 'password123',
        email: 'zaitsev@example.com',
        mobile_phone: '+7 (999) 999-99-99',
        telegram_account: '@zaitsev_agent',
        is_active: true,
      },
      {
        first_name: 'Светлана',
        last_name: 'Павлова',
        login: 'pavlova',
        password: 'password123',
        email: 'pavlova@example.com',
        mobile_phone: '+7 (999) 000-00-00',
        telegram_account: '@pavlova_agent',
        is_active: true,
      },
    ]

    let addedCount = 0
    for (const agent of agents) {
      const result = await pool.query(`INSERT INTO agents (first_name, last_name, login, password, email, mobile_phone, telegram_account, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (login) DO NOTHING
        RETURNING id`,
      [agent.first_name, agent.last_name, agent.login, agent.password, agent.email, agent.mobile_phone, agent.telegram_account, agent.is_active],
      )

      if (result.rowCount > 0) {
        addedCount++
        console.log(`✅ Добавлен агент: ${agent.first_name} ${agent.last_name}`)
      }
      else {
        console.log(`⚠️ Агент с логином "${agent.login}" уже существует`)
      }
    }

    console.log(`✅ Добавлено ${addedCount} новых агентов из 10`)
    process.exit(0)
  }
  catch (err) {
    console.error('❌ Ошибка:', err)
    process.exit(1)
  }
}

add10AgentsTestData()
