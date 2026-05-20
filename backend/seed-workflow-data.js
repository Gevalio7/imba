/**
 * Seed Data для демонстрации системы динамических воркфлоу
 *
 * Создает два разных воркфлоу:
 * 1. Bug Workflow: New → Open → Fixed → Closed (с возможностью возврата)
 * 2. Incident Workflow: New → Investigating → Resolved (линейный)
 */

const { pool } = require('./config/db')

async function seedWorkflowData() {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    console.log('🌱 Начинаем заполнение данных воркфлоу...\n')

    // =====================================================
    // 1. Создаем воркфлоу
    // =====================================================
    console.log('📋 Создание воркфлоу...')

    const workflowsResult = await client.query(`
      INSERT INTO workflows (name, description, is_active) VALUES
        ('Bug Workflow', 'Жизненный цикл багов с возможностью возврата на доработку', true),
        ('Incident Workflow', 'Линейный процесс обработки инцидентов', true),
        ('Change Request Workflow', 'Процесс согласования изменений', true)
      RETURNING id, name
    `)

    const workflows = workflowsResult.rows

    console.log(`   ✅ Создано ${workflows.length} воркфлоу:`)
    workflows.forEach(w => console.log(`      - ${w.name} (ID: ${w.id})`))

    // =====================================================
    // 2. Получаем ID статусов
    // =====================================================
    console.log('\n📌 Получение статусов...')

    const statesResult = await client.query('SELECT id, name FROM states ORDER BY id')
    const states = statesResult.rows

    // Создаем маппинг по имени
    const stateMap = {}

    states.forEach(s => {
      stateMap[s.name] = s.id
    })

    console.log(`   ✅ Найдено ${states.length} статусов:`)
    states.forEach(s => console.log(`      - ${s.name} (ID: ${s.id})`))

    // =====================================================
    // 3. Создаем переходы для Bug Workflow (ID: 1)
    // =====================================================
    console.log('\n🔄 Создание переходов для Bug Workflow...')

    const bugWorkflowId = workflows.find(w => w.name === 'Bug Workflow').id

    // Предполагаем следующие статусы:
    // - Новый (New)
    // - Открыт (Open)
    // - В работе (In Progress)
    // - Решен (Fixed/Resolved)
    // - Закрыт (Closed)

    const bugTransitions = [
      // Начальный переход (создание тикета)
      { source: null, target: 'Новый', label: 'Создать', order: 1 },

      // Из "Новый"
      { source: 'Новый', target: 'Открыт', label: 'Открыть', order: 2 },
      { source: 'Новый', target: 'В работе', label: 'Взять в работу', order: 3 },

      // Из "Открыт"
      { source: 'Открыт', target: 'В работе', label: 'Взять в работу', order: 4 },

      // Из "В работе"
      { source: 'В работе', target: 'Решен', label: 'Решить', order: 5 },
      { source: 'В работе', target: 'Открыт', label: 'Вернуть на рассмотрение', order: 6 },

      // Из "Решен" - с возможностью возврата!
      { source: 'Решен', target: 'Закрыт', label: 'Закрыть', order: 7 },
      { source: 'Решен', target: 'В работе', label: 'Открыть снова', order: 8 },

      // Из "Закрыт" - тоже можно вернуть
      { source: 'Закрыт', target: 'В работе', label: 'Переоткрыть', order: 9 },
    ]

    for (const t of bugTransitions) {
      const sourceId = t.source ? stateMap[t.source] : null
      const targetId = stateMap[t.target]

      if (!targetId) {
        console.log(`   ⚠️ Пропущен переход "${t.label}": статус "${t.target}" не найден`)
        continue
      }

      await client.query(`
        INSERT INTO workflow_transitions (workflow_id, source_status_id, target_status_id, action_label, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
      `, [bugWorkflowId, sourceId, targetId, t.label, t.order])
    }

    console.log(`   ✅ Создано ${bugTransitions.length} переходов для Bug Workflow`)

    // =====================================================
    // 4. Создаем переходы для Incident Workflow (ID: 2)
    // =====================================================
    console.log('\n🔄 Создание переходов для Incident Workflow...')

    const incidentWorkflowId = workflows.find(w => w.name === 'Incident Workflow').id

    const incidentTransitions = [
      // Начальный переход
      { source: null, target: 'Новый', label: 'Зарегистрировать', order: 1 },

      // Линейный поток БЕЗ возвратов
      { source: 'Новый', target: 'В работе', label: 'Начать расследование', order: 2 },
      { source: 'В работе', target: 'Решен', label: 'Решить', order: 3 },
      { source: 'Решен', target: 'Закрыт', label: 'Закрыть', order: 4 },
    ]

    for (const t of incidentTransitions) {
      const sourceId = t.source ? stateMap[t.source] : null
      const targetId = stateMap[t.target]

      if (!targetId) {
        console.log(`   ⚠️ Пропущен переход "${t.label}": статус "${t.target}" не найден`)
        continue
      }

      await client.query(`
        INSERT INTO workflow_transitions (workflow_id, source_status_id, target_status_id, action_label, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
      `, [incidentWorkflowId, sourceId, targetId, t.label, t.order])
    }

    console.log(`   ✅ Создано ${incidentTransitions.length} переходов для Incident Workflow`)

    // =====================================================
    // 5. Создаем переходы для Change Request Workflow (ID: 3)
    // =====================================================
    console.log('\n🔄 Создание переходов для Change Request Workflow...')

    const changeWorkflowId = workflows.find(w => w.name === 'Change Request Workflow').id

    const changeTransitions = [
      // Начальный переход
      { source: null, target: 'Новый', label: 'Создать запрос', order: 1 },

      // Процесс согласования
      { source: 'Новый', target: 'Открыт', label: 'Отправить на рассмотрение', order: 2 },
      { source: 'Открыт', target: 'В работе', label: 'Утвердить и начать', order: 3 },
      { source: 'Открыт', target: 'Закрыт', label: 'Отклонить', order: 4 },
      { source: 'В работе', target: 'Решен', label: 'Выполнить', order: 5 },
      { source: 'Решен', target: 'Закрыт', label: 'Закрыть', order: 6 },
    ]

    for (const t of changeTransitions) {
      const sourceId = t.source ? stateMap[t.source] : null
      const targetId = stateMap[t.target]

      if (!targetId) {
        console.log(`   ⚠️ Пропущен переход "${t.label}": статус "${t.target}" не найден`)
        continue
      }

      await client.query(`
        INSERT INTO workflow_transitions (workflow_id, source_status_id, target_status_id, action_label, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
      `, [changeWorkflowId, sourceId, targetId, t.label, t.order])
    }

    console.log(`   ✅ Создано ${changeTransitions.length} переходов для Change Request Workflow`)

    // =====================================================
    // 6. Привязываем воркфлоу к типам тикетов
    // =====================================================
    console.log('\n🔗 Привязка воркфлоу к типам тикетов...')

    // Получаем типы
    const typesResult = await client.query('SELECT id, name FROM types')
    const types = typesResult.rows

    // Маппинг типов к воркфлоу
    const typeWorkflowMapping = {
      Инцидент: incidentWorkflowId,
      Проблема: bugWorkflowId,
      Изменение: changeWorkflowId,
      Задача: bugWorkflowId,
    }

    for (const type of types) {
      const workflowId = typeWorkflowMapping[type.name]
      if (workflowId) {
        await client.query('UPDATE types SET workflow_id = $1 WHERE id = $2', [workflowId, type.id])
        console.log(`   ✅ ${type.name} → Workflow ID: ${workflowId}`)
      }
    }

    await client.query('COMMIT')

    console.log('\n✅ Seed data успешно создано!')

    // =====================================================
    // 7. Выводим пример API ответа
    // =====================================================
    console.log('\n📤 Пример API ответа GET /api/tickets/:id/actions:')
    console.log(JSON.stringify({
      ticketId: 1,
      currentStatusId: 2,
      currentStatusName: "Новый",
      workflowId: 1,
      actions: [
        { id: 1, label: "Открыть", targetStatusId: 3, targetStatusName: "Открыт", targetStatusColor: "#4CAF50" },
        { id: 2, label: "Взять в работу", targetStatusId: 4, targetStatusName: "В работе", targetStatusColor: "#2196F3" },
      ],
    }, null, 2))
  }
  catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Ошибка при создании seed data:', error)
    throw error
  }
  finally {
    client.release()
    await pool.end()
  }
}

// Запуск
seedWorkflowData().catch(console.error)
