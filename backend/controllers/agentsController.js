const Agents = require('../models/agents');
const { asyncHandler } = require('../middleware/errorHandler');

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
  data.name = req.body.name;
  data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newAgent = await Agents.create(data);

  res.status(201).json(newAgent);
});

const updateAgents = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentId = parseInt(id, 10);

  if (isNaN(agentId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedAgent = await Agents.update(agentId, data);

  if (!updatedAgent) {
    return res.status(404).json({ message: 'Agent not found' });
  }

  res.json(updatedAgent);
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

module.exports = {
  getAgents,
  getAgentById,
  createAgents,
  updateAgents,
  deleteAgents,
};
