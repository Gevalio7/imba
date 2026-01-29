const AgentsGroups = require('../models/agentsGroups');
const { asyncHandler } = require('../middleware/errorHandler');

const getAgentsGroups = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await AgentsGroups.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getAgentsGroupById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentsgroupId = parseInt(id, 10);

  if (isNaN(agentsgroupId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const agentsgroup = await AgentsGroups.getById(agentsgroupId);

  if (!agentsgroup) {
    return res.status(404).json({ message: 'AgentsGroup not found' });
  }

  res.json(agentsgroup);
});

const createAgentsGroups = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newAgentsGroup = await AgentsGroups.create(data);

  res.status(201).json(newAgentsGroup);
});

const updateAgentsGroups = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentsgroupId = parseInt(id, 10);

  if (isNaN(agentsgroupId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedAgentsGroup = await AgentsGroups.update(agentsgroupId, data);

  if (!updatedAgentsGroup) {
    return res.status(404).json({ message: 'AgentsGroup not found' });
  }

  res.json(updatedAgentsGroup);
});

const deleteAgentsGroups = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentsgroupId = parseInt(id, 10);

  if (isNaN(agentsgroupId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await AgentsGroups.delete(agentsgroupId);

  if (!deleted) {
    return res.status(404).json({ message: 'AgentsGroup not found' });
  }

  res.status(204).send();
});

const getAgentsInGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const groupId = parseInt(id, 10);

  if (isNaN(groupId)) {
    return res.status(400).json({ message: 'Invalid group ID' });
  }

  const agents = await AgentsGroups.getAgents(groupId);
  res.json(agents);
});

const addAgentToGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { agentId } = req.body;
  const groupId = parseInt(id, 10);
  const agentIdNum = parseInt(agentId, 10);

  if (isNaN(groupId) || isNaN(agentIdNum)) {
    return res.status(400).json({ message: 'Invalid IDs' });
  }

  await AgentsGroups.addAgent(groupId, agentIdNum);
  res.status(201).json({ message: 'Agent added to group' });
});

const removeAgentFromGroup = asyncHandler(async (req, res) => {
  const { id, agentId } = req.params;
  const groupId = parseInt(id, 10);
  const agentIdNum = parseInt(agentId, 10);

  if (isNaN(groupId) || isNaN(agentIdNum)) {
    return res.status(400).json({ message: 'Invalid IDs' });
  }

  await AgentsGroups.removeAgent(groupId, agentIdNum);
  res.status(204).send();
});

module.exports = {
  getAgentsGroups,
  getAgentsGroupById,
  createAgentsGroups,
  updateAgentsGroups,
  deleteAgentsGroups,
  getAgentsInGroup,
  addAgentToGroup,
  removeAgentFromGroup,
};
