const ProcessManagement = require('../models/processManagement');
const { asyncHandler } = require('../middleware/errorHandler');

const getProcessManagement = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await ProcessManagement.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getProcessManagementById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const processmanagementId = parseInt(id, 10);

  if (isNaN(processmanagementId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const processmanagement = await ProcessManagement.getById(processmanagementId);

  if (!processmanagement) {
    return res.status(404).json({ message: 'ProcessManagement not found' });
  }

  res.json(processmanagement);
});

const createProcessManagement = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.description = req.body.description;
  data.processType = req.body.processType;
  data.lastExecuted = req.body.lastExecuted;
  data.nextExecution = req.body.nextExecution;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newProcessManagement = await ProcessManagement.create(data);

  res.status(201).json(newProcessManagement);
});

const updateProcessManagement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const processmanagementId = parseInt(id, 10);

  if (isNaN(processmanagementId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.description !== undefined) data.description = req.body.description;
  if (req.body.processType !== undefined) data.processType = req.body.processType;
  if (req.body.lastExecuted !== undefined) data.lastExecuted = req.body.lastExecuted;
  if (req.body.nextExecution !== undefined) data.nextExecution = req.body.nextExecution;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedProcessManagement = await ProcessManagement.update(processmanagementId, data);

  if (!updatedProcessManagement) {
    return res.status(404).json({ message: 'ProcessManagement not found' });
  }

  res.json(updatedProcessManagement);
});

const deleteProcessManagement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const processmanagementId = parseInt(id, 10);

  if (isNaN(processmanagementId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await ProcessManagement.delete(processmanagementId);

  if (!deleted) {
    return res.status(404).json({ message: 'ProcessManagement not found' });
  }

  res.status(204).send();
});

module.exports = {
  getProcessManagement,
  getProcessManagementById,
  createProcessManagement,
  updateProcessManagement,
  deleteProcessManagement,
};
