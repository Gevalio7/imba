const { pool } = require('./config/db')

async function migrateAgentsRolesToGroups() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    console.log('🔄 Начинаем миграцию агентов из прямых ролей в роли через группы...')

    // Найти всех агентов с role_id
    const agentsWithRoles = await client.query(`
      SELECT id, role_id, first_name, last_name
      FROM agents
      WHERE role_id IS NOT NULL
    `)

    console.log(`📊 Найдено ${agentsWithRoles.rows.length} агентов с прямыми ролями`)

    for (const agent of agentsWithRoles.rows) {
      // Проверить, есть ли у агента группы
      const groupsCheck = await client.query(`
        SELECT COUNT(*) as count
        FROM agents_groups_agents
        WHERE agent_id = $1
      `, [agent.id])

      if (groupsCheck.rows[0].count === '0') {
        // У агента нет групп - создать дефолтную группу для его роли
        const roleName = await client.query(`
          SELECT name FROM roles WHERE id = $1
        `, [agent.role_id])

        if (roleName.rows.length > 0) {
          const groupName = `Группа ${roleName.rows[0].name}`

          console.log(`👤 Агент ${agent.first_name} ${agent.last_name} (ID ${agent.id}): создаём группу "${groupName}"`)

          // Проверить, есть ли уже такая группа
          let group = await client.query(`
            SELECT id FROM agents_groups
            WHERE name = $1 AND role_id = $2
          `, [groupName, agent.role_id])

          if (group.rows.length === 0) {
            // Создать группу
            group = await client.query(`
              INSERT INTO agents_groups (name, role_id, is_active)
              VALUES ($1, $2, true)
              RETURNING id
            `, [groupName, agent.role_id])
            console.log(`✅ Создана группа "${groupName}" (ID ${group.rows[0].id})`)
          }

          // Добавить агента в группу
          await client.query(`
            INSERT INTO agents_groups_agents (agents_group_id, agent_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [group.rows[0].id, agent.id])

          // Добавить роль в agents_groups_roles
          await client.query(`
            INSERT INTO agents_groups_roles (agents_group_id, role_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [group.rows[0].id, agent.role_id])

          console.log(`✅ Агент ${agent.first_name} ${agent.last_name} (ID ${agent.id}) добавлен в группу "${groupName}"`)
        }
        else {
          console.log(`⚠️  Не найдена роль с ID ${agent.role_id} для агента ${agent.first_name} ${agent.last_name}`)
        }
      }
      else {
        // У агента есть группы - проверить соответствие ролей
        const groupRoles = await client.query(`
          SELECT DISTINCT ag.role_id, r.name
          FROM agents_groups_agents aga
          JOIN agents_groups ag ON aga.agents_group_id = ag.id
          LEFT JOIN roles r ON ag.role_id = r.id
          WHERE aga.agent_id = $1
        `, [agent.id])

        const hasMatchingRole = groupRoles.rows.some(gr => gr.role_id === agent.role_id)

        if (!hasMatchingRole) {
          console.log(`⚠️  Агент ${agent.first_name} ${agent.last_name} (ID ${agent.id}): role_id=${agent.role_id} не совпадает с ролями групп`)
          console.log(`   Роли в группах: ${groupRoles.rows.map(r => `${r.role_id}:${r.name}`).join(', ')}`)
        }
        else {
          console.log(`✅ Агент ${agent.first_name} ${agent.last_name} (ID ${agent.id}): роль уже соответствует группам`)
        }
      }
    }

    // Проверить агентов без ролей
    const agentsWithoutRoles = await client.query(`
      SELECT id, first_name, last_name
      FROM agents
      WHERE role_id IS NULL
    `)

    console.log(`📊 Агентов без прямых ролей: ${agentsWithoutRoles.rows.length}`)

    await client.query('COMMIT')
    console.log('✅ Миграция завершена успешно')
  }
  catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Ошибка миграции:', error)
    throw error
  }
  finally {
    client.release()
  }
}

// Запуск миграции
if (require.main === module) {
  migrateAgentsRolesToGroups()
    .then(() => {
      console.log('🎉 Миграция данных завершена')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Критическая ошибка миграции:', error)
      process.exit(1)
    })
}

module.exports = { migrateAgentsRolesToGroups }
