const GenericAgent = require('../models/genericAgent');
const { asyncHandler } = require('../middleware/errorHandler');

const getGenericAgent = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await GenericAgent.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getGenericAgentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const genericagentId = parseInt(id, 10);

  if (isNaN(genericagentId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const genericagent = await GenericAgent.getById(genericagentId);

  if (!genericagent) {
    return res.status(404).json({ message: 'GenericAgent not found' });
  }

  res.json(genericagent);
});

const createGenericAgent = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.description = req.body.description;
  data.triggerType = req.body.triggerType;
  data.schedule = req.body.schedule;
  data.lastRun = req.body.lastRun;
  data.nextRun = req.body.nextRun;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newGenericAgent = await GenericAgent.create(data);

  res.status(201).json(newGenericAgent);
});

const updateGenericAgent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const genericagentId = parseInt(id, 10);

  if (isNaN(genericagentId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.description !== undefined) data.description = req.body.description;
  if (req.body.triggerType !== undefined) data.triggerType = req.body.triggerType;
  if (req.body.schedule !== undefined) data.schedule = req.body.schedule;
  if (req.body.lastRun !== undefined) data.lastRun = req.body.lastRun;
  if (req.body.nextRun !== undefined) data.nextRun = req.body.nextRun;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedGenericAgent = await GenericAgent.update(genericagentId, data);

  if (!updatedGenericAgent) {
    return res.status(404).json({ message: 'GenericAgent not found' });
  }

  res.json(updatedGenericAgent);
});

const deleteGenericAgent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const genericagentId = parseInt(id, 10);

  if (isNaN(genericagentId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await GenericAgent.delete(genericagentId);

  if (!deleted) {
    return res.status(404).json({ message: 'GenericAgent not found' });
  }

  res.status(204).send();
});

module.exports = {
  getGenericAgent,
  getGenericAgentById,
  createGenericAgent,
  updateGenericAgent,
  deleteGenericAgent,
};
