const Workflows = require('../models/workflows');
const WorkflowTransitions = require('../models/workflowTransitions');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/workflows - Получить все воркфлоу
const getWorkflows = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Workflows.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

// GET /api/workflows/:id - Получить воркфлоу по ID
const getWorkflowById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const workflowId = parseInt(id, 10);

  if (isNaN(workflowId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const workflow = await Workflows.getById(workflowId);

  if (!workflow) {
    return res.status(404).json({ message: 'Workflow not found' });
  }

  res.json(workflow);
});

// GET /api/workflows/:id/transitions - Получить воркфлоу с переходами
const getWorkflowWithTransitions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const workflowId = parseInt(id, 10);

  if (isNaN(workflowId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const workflow = await Workflows.getWithTransitions(workflowId);

  if (!workflow) {
    return res.status(404).json({ message: 'Workflow not found' });
  }

  res.json(workflow);
});

// POST /api/workflows - Создать воркфлоу
const createWorkflow = asyncHandler(async (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newWorkflow = await Workflows.create({
    name: req.body.name,
    description: req.body.description,
    isActive: req.body.isActive,
  });

  res.status(201).json(newWorkflow);
});

// PUT /api/workflows/:id - Обновить воркфлоу
const updateWorkflow = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const workflowId = parseInt(id, 10);

  if (isNaN(workflowId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const updatedWorkflow = await Workflows.update(workflowId, {
    name: req.body.name,
    description: req.body.description,
    isActive: req.body.isActive,
  });

  if (!updatedWorkflow) {
    return res.status(404).json({ message: 'Workflow not found' });
  }

  res.json(updatedWorkflow);
});

// DELETE /api/workflows/:id - Удалить воркфлоу
const deleteWorkflow = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const workflowId = parseInt(id, 10);

  if (isNaN(workflowId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await Workflows.delete(workflowId);

  if (!deleted) {
    return res.status(404).json({ message: 'Workflow not found' });
  }

  res.status(204).send();
});

// =====================================================
// ПЕРЕХОДЫ (TRANSITIONS)
// =====================================================

// GET /api/workflows/:id/transitions - Получить переходы воркфлоу
const getTransitions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const workflowId = parseInt(id, 10);

  if (isNaN(workflowId)) {
    return res.status(400).json({ message: 'Invalid workflow ID' });
  }

  const result = await WorkflowTransitions.getAll({
    workflowId,
    sortBy: 'sortOrder',
    orderBy: 'asc',
  });

  res.json(result);
});

// POST /api/workflows/:id/transitions - Создать переход
const createTransition = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const workflowId = parseInt(id, 10);

  if (isNaN(workflowId)) {
    return res.status(400).json({ message: 'Invalid workflow ID' });
  }

  if (!req.body.targetStatusId) {
    return res.status(400).json({ message: 'targetStatusId is required' });
  }

  if (!req.body.actionLabel) {
    return res.status(400).json({ message: 'actionLabel is required' });
  }

  const newTransition = await WorkflowTransitions.create({
    workflowId,
    sourceStatusId: req.body.sourceStatusId,
    targetStatusId: req.body.targetStatusId,
    actionLabel: req.body.actionLabel,
    sortOrder: req.body.sortOrder,
    isActive: req.body.isActive,
  });

  res.status(201).json(newTransition);
});

// PUT /api/workflows/:workflowId/transitions/:transitionId - Обновить переход
const updateTransition = asyncHandler(async (req, res) => {
  const { workflowId, transitionId } = req.params;
  const wfId = parseInt(workflowId, 10);
  const trId = parseInt(transitionId, 10);

  if (isNaN(wfId) || isNaN(trId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const updatedTransition = await WorkflowTransitions.update(trId, {
    workflowId: wfId,
    sourceStatusId: req.body.sourceStatusId,
    targetStatusId: req.body.targetStatusId,
    actionLabel: req.body.actionLabel,
    sortOrder: req.body.sortOrder,
    isActive: req.body.isActive,
  });

  if (!updatedTransition) {
    return res.status(404).json({ message: 'Transition not found' });
  }

  res.json(updatedTransition);
});

// DELETE /api/workflows/:workflowId/transitions/:transitionId - Удалить переход
const deleteTransition = asyncHandler(async (req, res) => {
  const { transitionId } = req.params;
  const trId = parseInt(transitionId, 10);

  if (isNaN(trId)) {
    return res.status(400).json({ message: 'Invalid transition ID' });
  }

  const deleted = await WorkflowTransitions.delete(trId);

  if (!deleted) {
    return res.status(404).json({ message: 'Transition not found' });
  }

  res.status(204).send();
});

// POST /api/workflows/:id/transitions/bulk - Массовое создание переходов
const bulkCreateTransitions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const workflowId = parseInt(id, 10);

  if (isNaN(workflowId)) {
    return res.status(400).json({ message: 'Invalid workflow ID' });
  }

  if (!Array.isArray(req.body.transitions)) {
    return res.status(400).json({ message: 'transitions array is required' });
  }

  const transitions = req.body.transitions.map(t => ({
    ...t,
    workflowId,
  }));

  const results = await WorkflowTransitions.bulkCreate(transitions);

  res.status(201).json({ transitions: results, count: results.length });
});

module.exports = {
  getWorkflows,
  getWorkflowById,
  getWorkflowWithTransitions,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getTransitions,
  createTransition,
  updateTransition,
  deleteTransition,
  bulkCreateTransitions,
};
