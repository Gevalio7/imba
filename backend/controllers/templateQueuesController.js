const TemplateQueues = require('../models/templateQueues');
const { asyncHandler } = require('../middleware/errorHandler');

const getTemplateQueues = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await TemplateQueues.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getTemplateQueueById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const templatequeueId = parseInt(id, 10);

  if (isNaN(templatequeueId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const templatequeue = await TemplateQueues.getById(templatequeueId);

  if (!templatequeue) {
    return res.status(404).json({ message: 'TemplateQueue not found' });
  }

  res.json(templatequeue);
});

const createTemplateQueues = asyncHandler(async (req, res) => {
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

  const newTemplateQueue = await TemplateQueues.create(data);

  res.status(201).json(newTemplateQueue);
});

const updateTemplateQueues = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const templatequeueId = parseInt(id, 10);

  if (isNaN(templatequeueId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedTemplateQueue = await TemplateQueues.update(templatequeueId, data);

  if (!updatedTemplateQueue) {
    return res.status(404).json({ message: 'TemplateQueue not found' });
  }

  res.json(updatedTemplateQueue);
});

const deleteTemplateQueues = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const templatequeueId = parseInt(id, 10);

  if (isNaN(templatequeueId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await TemplateQueues.delete(templatequeueId);

  if (!deleted) {
    return res.status(404).json({ message: 'TemplateQueue not found' });
  }

  res.status(204).send();
});

module.exports = {
  getTemplateQueues,
  getTemplateQueueById,
  createTemplateQueues,
  updateTemplateQueues,
  deleteTemplateQueues,
};
