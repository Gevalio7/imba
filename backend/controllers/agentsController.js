const Agents = require('../models/agents');
const { asyncHandler } = require('../middleware/errorHandler');
const { pool } = require('../config/db');

const getAgents = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page, isActive } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 1000;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;
  
  // Обрабатываем фильтр по статусу
  let isActiveFilter = undefined;
  if (isActive !== undefined) {
    isActiveFilter = isActive === 'true' || isActive === true;
  }

  const result = await Agents.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
    isActive: isActiveFilter,
  });

  res.json(result);
});

const getAgentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentId = parseInt(id, 10);

  if (isNaN(agentId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  // Проверка доступа: только сам агент может просматривать свой профиль
  // Временно убрана для тестирования
  console.log('getAgentById check:', { reqUserId: req.userId, agentId, reqUserIdType: typeof req.userId, agentIdType: typeof agentId, numberReq: Number(req.userId), equal: Number(req.userId) === agentId })
  // if (Number(req.userId) !== agentId) {
  //   console.log('Access denied for getAgentById')
  //   return res.status(403).json({ message: 'Доступ запрещен: можно просматривать только свой профиль' });
  // }

  const agent = await Agents.getById(agentId);

  if (!agent) {
    return res.status(404).json({ message: 'Agent not found' });
  }

  res.json(agent);
});

const createAgents = asyncHandler(async (req, res) => {
  const bcrypt = require('bcryptjs');
  const data = {};
  data.firstName = req.body.firstName;
  data.lastName = req.body.lastName;
  data.login = req.body.login;
  if (req.body.password) {
    data.password = await bcrypt.hash(req.body.password, 10);
  }
  data.email = req.body.email || null;
  data.mobilePhone = req.body.mobilePhone;
  data.telegramAccount = req.body.telegramAccount;
  data.avatar = req.body.avatar;

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Добавляем roleId если передан
  if (req.body.roleId !== undefined) {
    data.roleId = req.body.roleId;
  }

  // Валидация обязательных полей
  if (!data.firstName || !data.lastName) {
    return res.status(400).json({ message: 'firstName and lastName are required' });
  }

  try {
    const newAgent = await Agents.create(data);
    res.status(201).json(newAgent);
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({ message: error.message });
    }
    throw error;
  }
});

const updateAgents = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentId = parseInt(id, 10);

  if (isNaN(agentId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  // Проверка доступа: только сам агент может редактировать свой профиль
  // Временно убрана для тестирования
  console.log('updateAgents check:', { reqUserId: req.userId, agentId, reqUserIdType: typeof req.userId, agentIdType: typeof agentId, equal: Number(req.userId) === agentId })
  // if (Number(req.userId) !== agentId) {
  //   console.log('Access denied for updateAgents')
  //   return res.status(403).json({ message: 'Доступ запрещен: можно редактировать только свой профиль' });
  // }

  const data = {};
  if (req.body.firstName !== undefined) data.firstName = req.body.firstName;
  if (req.body.lastName !== undefined) data.lastName = req.body.lastName;
  if (req.body.login !== undefined) data.login = req.body.login;
  if (req.body.password !== undefined) data.password = await bcrypt.hash(req.body.password, 10);
  if (req.body.email !== undefined) data.email = req.body.email || null;
  if (req.body.mobilePhone !== undefined) data.mobilePhone = req.body.mobilePhone;
  if (req.body.telegramAccount !== undefined) data.telegramAccount = req.body.telegramAccount;
  if (req.body.avatar !== undefined) data.avatar = req.body.avatar;

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Добавляем roleId если передан
  if (req.body.roleId !== undefined) {
    data.roleId = req.body.roleId;
  }

  try {
    const updatedAgent = await Agents.update(agentId, data);

    if (!updatedAgent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json(updatedAgent);
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({ message: error.message });
    }
    throw error;
  }
});

const deleteAgents = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentId = parseInt(id, 10);

  if (isNaN(agentId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await Agents.delete(agentId);

  if (!deleted) {
    return res.status(404).json({ message: 'Agent not found' });
  }

  res.status(204).send();
});

// Получить группы агента
const getAgentGroups = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentId = parseInt(id, 10);

  if (isNaN(agentId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const result = await pool.query(
    `SELECT ag.id, ag.name, ag.is_active as "isActive"
     FROM agents_groups ag
     JOIN agents_groups_agents aga ON ag.id = aga.agents_group_id
     WHERE aga.agent_id = $1`,
    [agentId]
  );

  res.json({ agentGroups: result.rows });
});

// Получить очереди агента (через группы)
const getAgentQueues = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentId = parseInt(id, 10);

  if (isNaN(agentId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const result = await pool.query(
    `SELECT DISTINCT q.id, q.name, ag.name as "groupName"
     FROM queues q
     JOIN agents_groups ag ON q.agent_group_id = ag.id
     JOIN agents_groups_agents aga ON ag.id = aga.agents_group_id
     WHERE aga.agent_id = $1 AND q.is_active = true AND ag.is_active = true`,
    [agentId]
  );

  res.json({ agentQueues: result.rows });
});

// Обновить очереди агента (пока не реализовано, так как очереди назначаются через группы)
const updateAgentQueues = asyncHandler(async (req, res) => {
  // Очереди назначаются через группы, поэтому обновление не требуется
  res.json({ message: 'Queues are managed through agent groups' });
});

// Обновить группы агента
const updateAgentGroups = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentId = parseInt(id, 10);
  const { groupIds } = req.body;

  if (isNaN(agentId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  if (!Array.isArray(groupIds)) {
    return res.status(400).json({ message: 'groupIds must be an array' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Удаляем все текущие связи
    await client.query(
      'DELETE FROM agents_groups_agents WHERE agent_id = $1',
      [agentId]
    );

    // Добавляем новые связи
    for (const groupId of groupIds) {
      await client.query(
        'INSERT INTO agents_groups_agents (agent_id, agents_group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [agentId, groupId]
      );
    }

    await client.query('COMMIT');

    res.json({ message: 'Groups updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// Получить активность агента
const getAgentActivities = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentId = parseInt(id, 10);

  if (isNaN(agentId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  try {
    const activities = [];

    // Получить созданные тикеты
    const createdTickets = await pool.query(
      `SELECT
        t.id as ticket_id,
        t.ticket_number,
        t.title,
        t.created_at,
        'ticket_created' as type,
        'Создал обращение' as description,
        CONCAT('Создано новое обращение: ', t.title) as details
       FROM tickets t
       WHERE t.owner_id = $1
       ORDER BY t.created_at DESC
       LIMIT 20`,
      [agentId]
    );

    // Получить изменения статуса
    const statusChanges = await pool.query(
      `SELECT
        th.id,
        th.ticket_id,
        t.ticket_number,
        th.old_value,
        th.new_value,
        th.created_at,
        'status_changed' as type,
        'Изменил статус обращения' as description,
        CONCAT('Статус изменен с \"', COALESCE(ts_old.name, th.old_value), '\" на \"', COALESCE(ts_new.name, th.new_value), '\"') as details
       FROM ticket_history th
       JOIN tickets t ON th.ticket_id = t.id
       LEFT JOIN ticket_states ts_old ON ts_old.id::text = th.old_value
       LEFT JOIN ticket_states ts_new ON ts_new.id::text = th.new_value
       WHERE th.changed_by = $1 AND th.field = 'stateId'
       ORDER BY th.created_at DESC
       LIMIT 20`,
      [agentId]
    );

    // Получить комментарии
    const comments = await pool.query(
      `SELECT
        tc.id,
        tc.ticket_id,
        t.ticket_number,
        tc.content,
        tc.created_at,
        'comment_added' as type,
        'Добавил комментарий' as description,
        LEFT(tc.content, 100) as details
       FROM ticket_comments tc
       JOIN tickets t ON tc.ticket_id = t.id
       WHERE tc.author_id = $1
       ORDER BY tc.created_at DESC
       LIMIT 20`,
      [agentId]
    );

    // Получить вложения
    const attachments = await pool.query(
      `SELECT
        ta.id,
        ta.ticket_id,
        t.ticket_number,
        ta.filename,
        ta.created_at,
        'attachment_added' as type,
        'Добавил вложение' as description,
        CONCAT('Прикреплен файл: ', ta.filename) as details
       FROM ticket_attachments ta
       JOIN tickets t ON ta.ticket_id = t.id
       WHERE ta.uploaded_by = $1
       ORDER BY ta.created_at DESC
       LIMIT 20`,
      [agentId]
    );

    // Объединить все активности и отсортировать по времени
    activities.push(
      ...createdTickets.rows.map(row => ({
        id: `created_${row.ticket_id}`,
        type: row.type,
        description: row.description,
        timestamp: row.created_at,
        ticketId: row.ticket_id,
        ticketNumber: row.ticket_number,
        details: row.details
      })),
      ...statusChanges.rows.map(row => ({
        id: `status_${row.id}`,
        type: row.type,
        description: row.description,
        timestamp: row.created_at,
        ticketId: row.ticket_id,
        ticketNumber: row.ticket_number,
        details: row.details
      })),
      ...comments.rows.map(row => ({
        id: `comment_${row.id}`,
        type: row.type,
        description: row.description,
        timestamp: row.created_at,
        ticketId: row.ticket_id,
        ticketNumber: row.ticket_number,
        details: row.details
      })),
      ...attachments.rows.map(row => ({
        id: `attachment_${row.id}`,
        type: row.type,
        description: row.description,
        timestamp: row.created_at,
        ticketId: row.ticket_id,
        ticketNumber: row.ticket_number,
        attachmentName: row.filename,
        details: row.details
      }))
    );

    // Сортировать по времени (новые сначала) и ограничить до 50 записей
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, 50);

    res.json({ activities: limitedActivities });
  } catch (error) {
    console.error('Error fetching agent activities:', error);
    res.status(500).json({ message: 'Error fetching activities' });
  }
});

module.exports = {
  getAgents,
  getAgentById,
  createAgents,
  updateAgents,
  deleteAgents,
  getAgentGroups,
  updateAgentGroups,
  getAgentQueues,
  updateAgentQueues,
  getAgentActivities,
};
