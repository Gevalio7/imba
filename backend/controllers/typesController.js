const Types = require('../models/types');
const Workflows = require('../models/workflows');
const WorkflowTransitions = require('../models/workflowTransitions');
const { asyncHandler } = require('../middleware/errorHandler');

const getTypes = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Types.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getTypeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const typeId = parseInt(id, 10);

  if (isNaN(typeId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const type = await Types.getById(typeId);

  if (!type) {
    return res.status(404).json({ message: 'Type not found' });
  }

  res.json(type);
});

const createTypes = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.comment = req.body.comment;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Добавляем workflowId если передан
  if (req.body.workflowId !== undefined) {
    data.workflowId = req.body.workflowId;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newType = await Types.create(data);

  res.status(201).json(newType);
});

const updateTypes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const typeId = parseInt(id, 10);

  if (isNaN(typeId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.comment !== undefined) data.comment = req.body.comment;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Добавляем workflowId если передан
  if (req.body.workflowId !== undefined) {
    data.workflowId = req.body.workflowId;
  }

  const updatedType = await Types.update(typeId, data);

  if (!updatedType) {
    return res.status(404).json({ message: 'Type not found' });
  }

  res.json(updatedType);
});

const deleteTypes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const typeId = parseInt(id, 10);

  if (isNaN(typeId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await Types.delete(typeId);

  if (!deleted) {
    return res.status(404).json({ message: 'Type not found' });
  }

  res.status(204).send();
});

// GET /api/types/:id/workflow - Получить тип с workflow и доступными статусами для создания тикета
// Query params: currentStatusId - текущий статус тикета (для редактирования существующего тикета)
const getTypeWithWorkflow = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const typeId = parseInt(id, 10);
  const currentStatusIdParam = req.query.currentStatusId;
  const currentStatusId = currentStatusIdParam ? parseInt(currentStatusIdParam, 10) : null;

  if (isNaN(typeId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  // Получаем тип
  const type = await Types.getById(typeId);
  if (!type) {
    return res.status(404).json({ message: 'Type not found' });
  }

  // Если у типа нет связанного workflow, возвращаем только тип
  if (!type.workflowId) {
    return res.json({
      ...type,
      workflow: null,
      initialStatus: null,
      availableStatuses: [],
      currentStatusTransitions: [],
    });
  }

  // Получаем workflow
  const workflow = await Workflows.getById(type.workflowId);

  // Получаем начальный статус (переход с source_status_id = null)
  const initialTransition = await WorkflowTransitions.getInitialTransition(type.workflowId);

  // Получаем доступные переходы из начального статуса (для нового тикета)
  const availableTransitions = await WorkflowTransitions.getAvailableTransitions(type.workflowId, null);

  // Если передан currentStatusId, получаем доступные переходы из текущего статуса
  let currentStatusTransitions = [];
  if (currentStatusId) {
    currentStatusTransitions = await WorkflowTransitions.getAvailableTransitions(type.workflowId, currentStatusId);
  }

  res.json({
    ...type,
    workflow,
    initialStatus: initialTransition ? {
      id: initialTransition.targetStatusId,
      name: initialTransition.statusName,
      color: initialTransition.statusColor,
    } : null,
    availableStatuses: availableTransitions.map(t => ({
      id: t.targetStatusId,
      name: t.targetStatusName,
      color: t.targetStatusColor,
      actionLabel: t.actionLabel,
    })),
    // Доступные переходы из текущего статуса (для редактирования тикета)
    currentStatusTransitions: currentStatusTransitions.map(t => ({
      id: t.targetStatusId,
      name: t.targetStatusName,
      color: t.targetStatusColor,
      actionLabel: t.actionLabel,
    })),
  });
});

module.exports = {
  getTypes,
  getTypeById,
  createTypes,
  updateTypes,
  deleteTypes,
  getTypeWithWorkflow,
};
