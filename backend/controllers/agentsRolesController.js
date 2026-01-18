const AgentsRoles = require('../models/agentsRoles');
const { asyncHandler } = require('../middleware/errorHandler');

const getAgentsRoles = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await AgentsRoles.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getAgentsRoleById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentsroleId = parseInt(id, 10);

  if (isNaN(agentsroleId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const agentsrole = await AgentsRoles.getById(agentsroleId);

  if (!agentsrole) {
    return res.status(404).json({ message: 'AgentsRole not found' });
  }

  res.json(agentsrole);
});

const createAgentsRoles = asyncHandler(async (req, res) => {
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

  const newAgentsRole = await AgentsRoles.create(data);

  res.status(201).json(newAgentsRole);
});

const updateAgentsRoles = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentsroleId = parseInt(id, 10);

  if (isNaN(agentsroleId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedAgentsRole = await AgentsRoles.update(agentsroleId, data);

  if (!updatedAgentsRole) {
    return res.status(404).json({ message: 'AgentsRole not found' });
  }

  res.json(updatedAgentsRole);
});

const deleteAgentsRoles = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentsroleId = parseInt(id, 10);

  if (isNaN(agentsroleId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await AgentsRoles.delete(agentsroleId);

  if (!deleted) {
    return res.status(404).json({ message: 'AgentsRole not found' });
  }

  res.status(204).send();
});

module.exports = {
  getAgentsRoles,
  getAgentsRoleById,
  createAgentsRoles,
  updateAgentsRoles,
  deleteAgentsRoles,
};
