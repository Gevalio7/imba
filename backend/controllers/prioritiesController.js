const Priorities = require('../models/priorities');
const { asyncHandler } = require('../middleware/errorHandler');

const getPriorities = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Priorities.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getPriorityById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const priorityId = parseInt(id, 10);

  if (isNaN(priorityId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const priority = await Priorities.getById(priorityId);

  if (!priority) {
    return res.status(404).json({ message: 'Priority not found' });
  }

  res.json(priority);
});

const createPriorities = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.color = req.body.color;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newPriority = await Priorities.create(data);

  res.status(201).json(newPriority);
});

const updatePriorities = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const priorityId = parseInt(id, 10);

  if (isNaN(priorityId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.color !== undefined) data.color = req.body.color;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedPriority = await Priorities.update(priorityId, data);

  if (!updatedPriority) {
    return res.status(404).json({ message: 'Priority not found' });
  }

  res.json(updatedPriority);
});

const deletePriorities = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const priorityId = parseInt(id, 10);

  if (isNaN(priorityId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await Priorities.delete(priorityId);

  if (!deleted) {
    return res.status(404).json({ message: 'Priority not found' });
  }

  res.status(204).send();
});

module.exports = {
  getPriorities,
  getPriorityById,
  createPriorities,
  updatePriorities,
  deletePriorities,
};
