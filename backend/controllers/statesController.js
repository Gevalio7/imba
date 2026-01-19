const States = require('../models/states');
const { asyncHandler } = require('../middleware/errorHandler');

const getStates = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await States.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getStateById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const stateId = parseInt(id, 10);

  if (isNaN(stateId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const state = await States.getById(stateId);

  if (!state) {
    return res.status(404).json({ message: 'State not found' });
  }

  res.json(state);
});

const createStates = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.comment = req.body.comment;
  data.type = req.body.type;
  data.color = req.body.color;

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newState = await States.create(data);

  res.status(201).json(newState);
});

const updateStates = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const stateId = parseInt(id, 10);

  if (isNaN(stateId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.comment !== undefined) data.comment = req.body.comment;
  if (req.body.type !== undefined) data.type = req.body.type;
  if (req.body.color !== undefined) data.color = req.body.color;

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedState = await States.update(stateId, data);

  if (!updatedState) {
    return res.status(404).json({ message: 'State not found' });
  }

  res.json(updatedState);
});

const deleteStates = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const stateId = parseInt(id, 10);

  if (isNaN(stateId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await States.delete(stateId);

  if (!deleted) {
    return res.status(404).json({ message: 'State not found' });
  }

  res.status(204).send();
});

module.exports = {
  getStates,
  getStateById,
  createStates,
  updateStates,
  deleteStates,
};
