const QueueAutoResponse = require('../models/queueAutoResponse');
const { asyncHandler } = require('../middleware/errorHandler');

const getQueueAutoResponse = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await QueueAutoResponse.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getQueueAutoResponseById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const queueautoresponseId = parseInt(id, 10);

  if (isNaN(queueautoresponseId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const queueautoresponse = await QueueAutoResponse.getById(queueautoresponseId);

  if (!queueautoresponse) {
    return res.status(404).json({ message: 'QueueAutoResponse not found' });
  }

  res.json(queueautoresponse);
});

const createQueueAutoResponse = asyncHandler(async (req, res) => {
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

  const newQueueAutoResponse = await QueueAutoResponse.create(data);

  res.status(201).json(newQueueAutoResponse);
});

const updateQueueAutoResponse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const queueautoresponseId = parseInt(id, 10);

  if (isNaN(queueautoresponseId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedQueueAutoResponse = await QueueAutoResponse.update(queueautoresponseId, data);

  if (!updatedQueueAutoResponse) {
    return res.status(404).json({ message: 'QueueAutoResponse not found' });
  }

  res.json(updatedQueueAutoResponse);
});

const deleteQueueAutoResponse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const queueautoresponseId = parseInt(id, 10);

  if (isNaN(queueautoresponseId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await QueueAutoResponse.delete(queueautoresponseId);

  if (!deleted) {
    return res.status(404).json({ message: 'QueueAutoResponse not found' });
  }

  res.status(204).send();
});

module.exports = {
  getQueueAutoResponse,
  getQueueAutoResponseById,
  createQueueAutoResponse,
  updateQueueAutoResponse,
  deleteQueueAutoResponse,
};
