const { pool } = require('./config/db')

async function addAgentsGroupsRelationsTestData() {
  try {
    console.log('🔄 Добавление тестовых связей агентов с группами...')

    // Получить ID агентов
    const agentsResult = await pool.query('SELECT id, login FROM agents')
    const agents = agentsResult.rows

    // Получить ID групп
    const groupsResult = await pool.query('SELECT id, name FROM agents_groups')
    const groups = groupsResult.rows

    if (agents.length === 0 || groups.length === 0) {
      console.log('❌ Нет агентов или групп для связи')
      process.exit(1)
    }

    // Примеры связей: каждый агент в 1-2 группах
    const relations = [
      { agent_login: 'ivanov', group_name: 'Первая линия поддержки' },
      { agent_login: 'petrova', group_name: 'Первая линия поддержки' },
      { agent_login: 'sidorov', group_name: 'Вторая линия поддержки' },
      { agent_login: 'kuznetsova', group_name: 'Отдел продаж' },
      { agent_login: 'vasilev', group_name: 'Технические специалисты' },
      { agent_login: 'morozova', group_name: 'Менеджеры проектов' },
      { agent_login: 'novikov', group_name: 'Первая линия поддержки' },
      { agent_login: 'fedorova', group_name: 'Вторая линия поддержки' },
      { agent_login: 'ivanov', group_name: 'Отдел продаж' },
      { agent_login: 'petrova', group_name: 'Технические специалисты' },
    ]

    for (const relation of relations) {
      const agent = agents.find(a => a.login === relation.agent_login)
      const group = groups.find(g => g.name === relation.group_name)

      if (agent && group) {
        await pool.query(`INSERT INTO agents_groups_agents (agent_id, agents_group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [agent.id, group.id])
      }
    }

    console.log('✅ Добавлены тестовые связи агентов с группами')
    console.log('✅ Все тестовые связи добавлены успешно')
    process.exit(0)
  }
  catch (err) {
    console.error('❌ Ошибка:', err)
    process.exit(1)
  }
}

addAgentsGroupsRelationsTestData()
