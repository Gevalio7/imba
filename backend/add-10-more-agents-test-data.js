const { pool } = require('./config/db');

async function add10MoreAgentsTestData() {
  try {
    console.log('🔄 Добавление еще 10 тестовых агентов...');

    // Еще 10 новых тестовых агентов
    const agents = [
      {
        first_name: 'Владимир',
        last_name: 'Макаров',
        login: 'makarov',
        password: 'password123',
        email: 'makarov@example.com',
        mobile_phone: '+7 (999) 121-21-21',
        telegram_account: '@makarov_agent',
        is_active: true
      },
      {
        first_name: 'Екатерина',
        last_name: 'Андреева',
        login: 'andreeva',
        password: 'password123',
        email: 'andreeva@example.com',
        mobile_phone: '+7 (999) 232-32-32',
        telegram_account: '@andreeva_agent',
        is_active: true
      },
      {
        first_name: 'Игорь',
        last_name: 'Морозов',
        login: 'morozov_i',
        password: 'password123',
        email: 'morozov_i@example.com',
        mobile_phone: '+7 (999) 343-43-43',
        telegram_account: '@morozov_i_agent',
        is_active: true
      },
      {
        first_name: 'Наталья',
        last_name: 'Волкова',
        login: 'volkova_n',
        password: 'password123',
        email: 'volkova_n@example.com',
        mobile_phone: '+7 (999) 454-54-54',
        telegram_account: '@volkova_n_agent',
        is_active: true
      },
      {
        first_name: 'Александр',
        last_name: 'Лебедев',
        login: 'lebedev_a',
        password: 'password123',
        email: 'lebedev_a@example.com',
        mobile_phone: '+7 (999) 565-65-65',
        telegram_account: '@lebedev_a_agent',
        is_active: false
      },
      {
        first_name: 'Оксана',
        last_name: 'Семенова',
        login: 'semenova',
        password: 'password123',
        email: 'semenova@example.com',
        mobile_phone: '+7 (999) 676-76-76',
        telegram_account: '@semenova_agent',
        is_active: true
      },
      {
        first_name: 'Денис',
        last_name: 'Егоров',
        login: 'egorov',
        password: 'password123',
        email: 'egorov@example.com',
        mobile_phone: '+7 (999) 787-87-87',
        telegram_account: '@egorov_agent',
        is_active: true
      },
      {
        first_name: 'Марина',
        last_name: 'Попова',
        login: 'popova_m',
        password: 'password123',
        email: 'popova_m@example.com',
        mobile_phone: '+7 (999) 898-98-98',
        telegram_account: '@popova_m_agent',
        is_active: true
      },
      {
        first_name: 'Роман',
        last_name: 'Кузнецов',
        login: 'kuznetsov_r',
        password: 'password123',
        email: 'kuznetsov_r@example.com',
        mobile_phone: '+7 (999) 909-09-09',
        telegram_account: '@kuznetsov_r_agent',
        is_active: true
      },
      {
        first_name: 'Валерия',
        last_name: 'Николаева',
        login: 'nikolaeva',
        password: 'password123',
        email: 'nikolaeva@example.com',
        mobile_phone: '+7 (999) 010-10-10',
        telegram_account: '@nikolaeva_agent',
        is_active: true
      }
    ];

    let addedCount = 0;
    for (const agent of agents) {
      const result = await pool.query(`INSERT INTO agents (first_name, last_name, login, password, email, mobile_phone, telegram_account, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (login) DO NOTHING
        RETURNING id`,
        [agent.first_name, agent.last_name, agent.login, agent.password, agent.email, agent.mobile_phone, agent.telegram_account, agent.is_active]
      );
      if (result.rowCount > 0) {
        addedCount++;
        console.log(`✅ Добавлен агент: ${agent.first_name} ${agent.last_name}`);
      } else {
        console.log(`⚠️ Агент с логином "${agent.login}" уже существует`);
      }
    }

    console.log(`✅ Добавлено ${addedCount} новых агентов из 10`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка:', err);
    process.exit(1);
  }
}

add10MoreAgentsTestData();
