const { pool } = require('./config/db');

/**
 * Скрипт для создания тестовых агентов с группами и ролями
 * Запускать: node add-agents-with-groups.js
 */

async function addAgentsWithGroups() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Начало создания тестовых данных агентов...');
    
    await client.query('BEGIN');

    // 1. Создаем роли если их нет
    const roles = [
      { name: 'Администратор', icon: 'mdi-shield-crown' },
      { name: 'Менеджер', icon: 'mdi-account-tie' },
      { name: 'Специалист', icon: 'mdi-headset' },
      { name: 'Младший специалист', icon: 'mdi-account' }
    ];
    
    console.log('📋 Создание ролей...');
    const roleIds = {};
    
    for (const role of roles) {
      const existingRole = await client.query(
        'SELECT id FROM roles WHERE name = $1',
        [role.name]
      );
      
      if (existingRole.rows.length === 0) {
        const result = await client.query(
          'INSERT INTO roles (name, icon) VALUES ($1, $2) RETURNING id',
          [role.name, role.icon]
        );
        roleIds[role.name] = result.rows[0].id;
        console.log(`  ✅ Создана роль: ${role.name}`);
      } else {
        roleIds[role.name] = existingRole.rows[0].id;
        console.log(`  ⚠️ Роль уже существует: ${role.name}`);
      }
    }

    // 2. Создаем группы агентов
    const groups = [
      { name: 'Первая линия поддержки', role: 'Специалист', is_active: true },
      { name: 'Вторая линия поддержки', role: 'Менеджер', is_active: true },
      { name: 'Технический отдел', role: 'Администратор', is_active: true },
      { name: 'Отдел продаж', role: 'Менеджер', is_active: true },
      { name: 'Менеджеры проектов', role: 'Менеджер', is_active: true }
    ];
    
    console.log('📋 Создание групп агентов...');
    const groupIds = {};
    
    for (const group of groups) {
      const existingGroup = await client.query(
        'SELECT id FROM agents_groups WHERE name = $1',
        [group.name]
      );
      
      if (existingGroup.rows.length === 0) {
        const result = await client.query(
          'INSERT INTO agents_groups (name, role_id, is_active) VALUES ($1, $2, $3) RETURNING id',
          [group.name, roleIds[group.role], group.is_active]
        );
        groupIds[group.name] = result.rows[0].id;
        console.log(`  ✅ Создана группа: ${group.name} (роль: ${group.role})`);
      } else {
        groupIds[group.name] = existingGroup.rows[0].id;
        console.log(`  ⚠️ Группа уже существует: ${group.name}`);
      }
    }

    // 3. Создаем агентов
    const agents = [
      { first_name: 'Иван', last_name: 'Иванов', login: 'ivanov', email: 'ivanov@dreamdesc.ru', mobile: '+7 (999) 100-01-01', telegram: '@ivanov', active: true },
      { first_name: 'Мария', last_name: 'Петрова', login: 'petrova', email: 'petrova@dreamdesc.ru', mobile: '+7 (999) 100-02-02', telegram: '@petrova', active: true },
      { first_name: 'Алексей', last_name: 'Сидоров', login: 'sidorov', email: 'sidorov@dreamdesc.ru', mobile: '+7 (999) 100-03-03', telegram: '@sidorov', active: true },
      { first_name: 'Елена', last_name: 'Кузнецова', login: 'kuznetsova', email: 'kuznetsova@dreamdesc.ru', mobile: '+7 (999) 100-04-04', telegram: '@kuznetsova', active: true },
      { first_name: 'Дмитрий', last_name: 'Васильев', login: 'vasilev', email: 'vasilev@dreamdesc.ru', mobile: '+7 (999) 100-05-05', telegram: '@vasilev', active: true },
      { first_name: 'Ольга', last_name: 'Морозова', login: 'morozova', email: 'morozova@dreamdesc.ru', mobile: '+7 (999) 100-06-06', telegram: '@morozova', active: false },
      { first_name: 'Андрей', last_name: 'Новиков', login: 'novikov', email: 'novikov@dreamdesc.ru', mobile: '+7 (999) 100-07-07', telegram: '@novikov', active: true },
      { first_name: 'Татьяна', last_name: 'Федорова', login: 'fedorova', email: 'fedorova@dreamdesc.ru', mobile: '+7 (999) 100-08-08', telegram: '@fedorova', active: true },
      { first_name: 'Сергей', last_name: 'Попов', login: 'popov', email: 'popov@dreamdesc.ru', mobile: '+7 (999) 100-09-09', telegram: '@popov', active: true },
      { first_name: 'Анна', last_name: 'Соколова', login: 'sokolova', email: 'sokolova@dreamdesc.ru', mobile: '+7 (999) 100-10-10', telegram: '@sokolova', active: true },
      { first_name: 'Михаил', last_name: 'Лебедев', login: 'lebedev', email: 'lebedev@dreamdesc.ru', mobile: '+7 (999) 100-11-11', telegram: '@lebedev', active: true },
      { first_name: 'Виктория', last_name: 'Козлова', login: 'kozlova', email: 'kozlova@dreamdesc.ru', mobile: '+7 (999) 100-12-12', telegram: '@kozlova', active: true },
      { first_name: 'Павел', last_name: 'Соловьев', login: 'soloviev', email: 'soloviev@dreamdesc.ru', mobile: '+7 (999) 100-13-13', telegram: '@soloviev', active: true },
      { first_name: 'Юлия', last_name: 'Васильева', login: 'vasilieva', email: 'vasilieva@dreamdesc.ru', mobile: '+7 (999) 100-14-14', telegram: '@vasilieva', active: true },
      { first_name: 'Артем', last_name: 'Зайцев', login: 'zaitsev', email: 'zaitsev@dreamdesc.ru', mobile: '+7 (999) 100-15-15', telegram: '@zaitsev', active: true },
      { first_name: 'Светлана', last_name: 'Павлова', login: 'pavlova', email: 'pavlova@dreamdesc.ru', mobile: '+7 (999) 100-16-16', telegram: '@pavlova', active: true }
    ];
    
    console.log('📋 Создание агентов...');
    const agentIds = {};
    
    for (const agent of agents) {
      const existingAgent = await client.query(
        'SELECT id FROM agents WHERE login = $1',
        [agent.login]
      );
      
      if (existingAgent.rows.length === 0) {
        const result = await client.query(
          `INSERT INTO agents (first_name, last_name, login, password, email, mobile_phone, telegram_account, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [agent.first_name, agent.last_name, agent.login, 'password123', agent.email, agent.mobile, agent.telegram, agent.active]
        );
        agentIds[agent.login] = result.rows[0].id;
        console.log(`  ✅ Создан агент: ${agent.first_name} ${agent.last_name}`);
      } else {
        agentIds[agent.login] = existingAgent.rows[0].id;
        console.log(`  ⚠️ Агент уже существует: ${agent.first_name} ${agent.last_name}`);
      }
    }

    // 4. Связываем агентов с группами
    const agentGroupRelations = [
      { agent_login: 'ivanov', group_name: 'Первая линия поддержки' },
      { agent_login: 'petrova', group_name: 'Первая линия поддержки' },
      { agent_login: 'sidorov', group_name: 'Вторая линия поддержки' },
      { agent_login: 'kuznetsova', group_name: 'Отдел продаж' },
      { agent_login: 'vasilev', group_name: 'Технический отдел' },
      { agent_login: 'morozova', group_name: 'Менеджеры проектов' },
      { agent_login: 'novikov', group_name: 'Первая линия поддержки' },
      { agent_login: 'fedorova', group_name: 'Вторая линия поддержки' },
      { agent_login: 'popov', group_name: 'Первая линия поддержки' },
      { agent_login: 'sokolova', group_name: 'Отдел продаж' },
      { agent_login: 'lebedev', group_name: 'Технический отдел' },
      { agent_login: 'kozlova', group_name: 'Отдел продаж' },
      { agent_login: 'soloviev', group_name: 'Вторая линия поддержки' },
      { agent_login: 'vasilieva', group_name: 'Менеджеры проектов' },
      { agent_login: 'zaitsev', group_name: 'Технический отдел' },
      { agent_login: 'pavlova', group_name: 'Первая линия поддержки' },
      // Дополнительные связи
      { agent_login: 'ivanov', group_name: 'Отдел продаж' },
      { agent_login: 'petrova', group_name: 'Технический отдел' },
      { agent_login: 'sidorov', group_name: 'Менеджеры проектов' }
    ];
    
    console.log('📋 Связывание агентов с группами...');
    
    for (const relation of agentGroupRelations) {
      const agentId = agentIds[relation.agent_login];
      const groupId = groupIds[relation.group_name];
      
      if (agentId && groupId) {
        await client.query(
          `INSERT INTO agents_groups_agents (agent_id, agents_group_id) 
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [agentId, groupId]
        );
        console.log(`  ✅ ${relation.agent_login} → ${relation.group_name}`);
      }
    }

    await client.query('COMMIT');
    
    console.log('\n✅ Все тестовые данные агентов созданы успешно!');
    console.log('   - Ролей: ' + Object.keys(roleIds).length);
    console.log('   - Групп: ' + Object.keys(groupIds).length);
    console.log('   - Агентов: ' + Object.keys(agentIds).length);
    console.log('   - Связей агент-группа: ' + agentGroupRelations.length);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Ошибка:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

addAgentsWithGroups();
