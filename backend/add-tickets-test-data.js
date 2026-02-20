const { pool } = require('./config/db');

async function addTicketsTestData() {
  try {
    console.log('Adding tickets test data...');

    // Получаем существующие данные для связей
    const typesResult = await pool.query('SELECT id FROM types LIMIT 5');
    const prioritiesResult = await pool.query('SELECT id FROM priorities LIMIT 5');
    const queuesResult = await pool.query('SELECT id FROM queues LIMIT 5');
    const statesResult = await pool.query('SELECT id FROM states LIMIT 5');
    const agentsResult = await pool.query('SELECT id FROM agents LIMIT 5');
    const customersResult = await pool.query('SELECT id FROM customers LIMIT 5');
    const slaResult = await pool.query('SELECT id FROM sla LIMIT 5');

    const types = typesResult.rows;
    const priorities = prioritiesResult.rows;
    const queues = queuesResult.rows;
    const states = statesResult.rows;
    const agents = agentsResult.rows;
    const customers = customersResult.rows;
    const slas = slaResult.rows;

    // Проверяем есть ли данные
    if (types.length === 0) console.log('Warning: No types found');
    if (priorities.length === 0) console.log('Warning: No priorities found');
    if (queues.length === 0) console.log('Warning: No queues found');
    if (states.length === 0) console.log('Warning: No states found');
    if (agents.length === 0) console.log('Warning: No agents found');
    if (customers.length === 0) console.log('Warning: No customers found');
    if (slas.length === 0) console.log('Warning: No SLAs found');

    // Тестовые данные для тикетов
    const testTickets = [
      {
        ticketNumber: '1000001',
        title: 'Проблема с авторизацией в системе',
        typeId: types[0]?.id || null,
        priorityId: priorities[0]?.id || null,
        queueId: queues[0]?.id || null,
        stateId: states[0]?.id || null,
        ownerId: agents[0]?.id || null,
        companyId: customers[0]?.id || null,
        slaId: slas[0]?.id || null,
      },
      {
        ticketNumber: '1000002',
        title: 'Ошибка при оформлении заказа',
        typeId: types[1]?.id || types[0]?.id || null,
        priorityId: priorities[1]?.id || priorities[0]?.id || null,
        queueId: queues[1]?.id || queues[0]?.id || null,
        stateId: states[1]?.id || states[0]?.id || null,
        ownerId: agents[1]?.id || agents[0]?.id || null,
        companyId: customers[1]?.id || customers[0]?.id || null,
        slaId: slas[1]?.id || slas[0]?.id || null,
      },
      {
        ticketNumber: '1000003',
        title: 'Запрос на изменение пароля',
        typeId: types[2]?.id || types[0]?.id || null,
        priorityId: priorities[2]?.id || priorities[0]?.id || null,
        queueId: queues[2]?.id || queues[0]?.id || null,
        stateId: states[2]?.id || states[0]?.id || null,
        ownerId: agents[2]?.id || agents[0]?.id || null,
        companyId: customers[2]?.id || customers[0]?.id || null,
        slaId: slas[2]?.id || slas[0]?.id || null,
      },
      {
        ticketNumber: '1000004',
        title: 'Проблема с оплатой картой',
        typeId: types[0]?.id || null,
        priorityId: priorities[0]?.id || null,
        queueId: queues[0]?.id || null,
        stateId: states[0]?.id || null,
        ownerId: agents[0]?.id || null,
        companyId: customers[0]?.id || null,
        slaId: slas[0]?.id || null,
      },
      {
        ticketNumber: '1000005',
        title: 'Вопрос по доставке товара',
        typeId: types[1]?.id || types[0]?.id || null,
        priorityId: priorities[1]?.id || priorities[0]?.id || null,
        queueId: queues[1]?.id || queues[0]?.id || null,
        stateId: states[1]?.id || states[0]?.id || null,
        ownerId: agents[1]?.id || agents[0]?.id || null,
        companyId: customers[1]?.id || customers[0]?.id || null,
        slaId: slas[1]?.id || slas[0]?.id || null,
      },
      {
        ticketNumber: '1000006',
        title: 'Запрос на возврат средств',
        typeId: types[2]?.id || types[0]?.id || null,
        priorityId: priorities[2]?.id || priorities[0]?.id || null,
        queueId: queues[2]?.id || queues[0]?.id || null,
        stateId: states[2]?.id || states[0]?.id || null,
        ownerId: agents[2]?.id || agents[0]?.id || null,
        companyId: customers[2]?.id || customers[0]?.id || null,
        slaId: slas[2]?.id || slas[0]?.id || null,
      },
      {
        ticketNumber: '1000007',
        title: 'Техническая проблема с сайтом',
        typeId: types[0]?.id || null,
        priorityId: priorities[0]?.id || null,
        queueId: queues[0]?.id || null,
        stateId: states[0]?.id || null,
        ownerId: agents[0]?.id || null,
        companyId: customers[0]?.id || null,
        slaId: slas[0]?.id || null,
      },
      {
        ticketNumber: '1000008',
        title: 'Жалоба на качество обслуживания',
        typeId: types[1]?.id || types[0]?.id || null,
        priorityId: priorities[1]?.id || priorities[0]?.id || null,
        queueId: queues[1]?.id || queues[0]?.id || null,
        stateId: states[1]?.id || states[0]?.id || null,
        ownerId: agents[1]?.id || agents[0]?.id || null,
        companyId: customers[1]?.id || customers[0]?.id || null,
        slaId: slas[1]?.id || slas[0]?.id || null,
      },
      {
        ticketNumber: '1000009',
        title: 'Запрос информации о продукте',
        typeId: types[2]?.id || types[0]?.id || null,
        priorityId: priorities[2]?.id || priorities[0]?.id || null,
        queueId: queues[2]?.id || queues[0]?.id || null,
        stateId: states[2]?.id || states[0]?.id || null,
        ownerId: agents[2]?.id || agents[0]?.id || null,
        companyId: customers[2]?.id || customers[0]?.id || null,
        slaId: slas[2]?.id || slas[0]?.id || null,
      },
      {
        ticketNumber: '1000010',
        title: 'Предложение по улучшению сервиса',
        typeId: types[0]?.id || null,
        priorityId: priorities[0]?.id || null,
        queueId: queues[0]?.id || null,
        stateId: states[0]?.id || null,
        ownerId: agents[0]?.id || null,
        companyId: customers[0]?.id || null,
        slaId: slas[0]?.id || null,
      },
    ];

    // Вставляем тестовые данные
    for (const ticket of testTickets) {
      await pool.query(
        `INSERT INTO tickets (ticket_number, title, type_id, priority_id, queue_id, state_id, owner_id, company_id, sla_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - (random() * interval '7 days'))`,
        [ticket.ticketNumber, ticket.title, ticket.typeId, ticket.priorityId, ticket.queueId, ticket.stateId, ticket.ownerId, ticket.companyId, ticket.slaId]
      );
    }

    console.log(`Added ${testTickets.length} test tickets successfully!`);
  } catch (error) {
    console.error('Error adding test data:', error);
  } finally {
    await pool.end();
  }
}

addTicketsTestData();
