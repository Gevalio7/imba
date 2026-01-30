const Agents = require('../models/agents');
const { asyncHandler } = require('../middleware/errorHandler');
const { pool } = require('../config/db');

const getAgents = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Agents.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getAgentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentId = parseInt(id, 10);

  if (isNaN(agentId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const agent = await Agents.getById(agentId);

  if (!agent) {
    return res.status(404).json({ message: 'Agent not found' });
  }

  res.json(agent);
});

const createAgents = asyncHandler(async (req, res) => {
  const data = {};
  data.firstName = req.body.firstName;
  data.lastName = req.body.lastName;
  data.login = req.body.login;
  data.password = req.body.password;
  data.email = req.body.email;
  data.mobilePhone = req.body.mobilePhone;
  data.telegramAccount = req.body.telegramAccount;

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

  const data = {};
  if (req.body.firstName !== undefined) data.firstName = req.body.firstName;
  if (req.body.lastName !== undefined) data.lastName = req.body.lastName;
  if (req.body.login !== undefined) data.login = req.body.login;
  if (req.body.password !== undefined) data.password = req.body.password;
  if (req.body.email !== undefined) data.email = req.body.email;
  if (req.body.mobilePhone !== undefined) data.mobilePhone = req.body.mobilePhone;
  if (req.body.telegramAccount !== undefined) data.telegramAccount = req.body.telegramAccount;

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

module.exports = {
  getAgents,
  getAgentById,
  createAgents,
  updateAgents,
  deleteAgents,
  getAgentGroups,
  updateAgentGroups,
};
