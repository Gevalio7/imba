const StateTransitions = require('../models/stateTransitions');
const { asyncHandler } = require('../middleware/errorHandler');

const getStateTransitions = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page, typeId, fromStateId, toStateId } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;
  const typeIdLocal = typeId ? parseInt(typeId, 10) : undefined;
  const fromStateIdLocal = fromStateId ? parseInt(fromStateId, 10) : undefined;
  const toStateIdLocal = toStateId ? parseInt(toStateId, 10) : undefined;

  const result = await StateTransitions.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
    typeId: typeIdLocal,
    fromStateId: fromStateIdLocal,
    toStateId: toStateIdLocal,
  });

  res.json(result);
});

const getStateTransitionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const transitionId = parseInt(id, 10);

  if (isNaN(transitionId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const transition = await StateTransitions.getById(transitionId);

  if (!transition) {
    return res.status(404).json({ message: 'State transition not found' });
  }

  res.json(transition);
});

const createStateTransition = asyncHandler(async (req, res) => {
  const data = {};
  data.typeId = req.body.typeId;
  data.fromStateId = req.body.fromStateId;
  data.toStateId = req.body.toStateId;
  data.name = req.body.name;

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }
  
  if (!data.toStateId) {
    return res.status(400).json({ message: 'toStateId is required' });
  }

  const newTransition = await StateTransitions.create(data);

  res.status(201).json(newTransition);
});

const updateStateTransition = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const transitionId = parseInt(id, 10);

  if (isNaN(transitionId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.typeId !== undefined) data.typeId = req.body.typeId;
  if (req.body.fromStateId !== undefined) data.fromStateId = req.body.fromStateId;
  if (req.body.toStateId !== undefined) data.toStateId = req.body.toStateId;
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.isActive !== undefined) data.isActive = req.body.isActive;

  const updatedTransition = await StateTransitions.update(transitionId, data);

  if (!updatedTransition) {
    return res.status(404).json({ message: 'State transition not found' });
  }

  res.json(updatedTransition);
});

const deleteStateTransition = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const transitionId = parseInt(id, 10);

  if (isNaN(transitionId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await StateTransitions.delete(transitionId);

  if (!deleted) {
    return res.status(404).json({ message: 'State transition not found' });
  }

  res.status(204).send();
});

// Получить доступные переходы для тикета
const getAvailableTransitions = asyncHandler(async (req, res) => {
  const { typeId, currentStateId } = req.query;

  const typeIdLocal = typeId ? parseInt(typeId, 10) : null;
  const currentStateIdLocal = currentStateId ? parseInt(currentStateId, 10) : null;

  const transitions = await StateTransitions.getAvailableTransitions(typeIdLocal, currentStateIdLocal);

  res.json({ transitions });
});

module.exports = {
  getStateTransitions,
  getStateTransitionById,
  createStateTransition,
  updateStateTransition,
  deleteStateTransition,
  getAvailableTransitions,
};
