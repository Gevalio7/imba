const SystemLog = require('../models/systemLog');
const { asyncHandler } = require('../middleware/errorHandler');

const getSystemLog = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await SystemLog.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getSystemLogById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const systemlogId = parseInt(id, 10);

  if (isNaN(systemlogId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const systemlog = await SystemLog.getById(systemlogId);

  if (!systemlog) {
    return res.status(404).json({ message: 'SystemLog not found' });
  }

  res.json(systemlog);
});

const createSystemLog = asyncHandler(async (req, res) => {
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

  const newSystemLog = await SystemLog.create(data);

  res.status(201).json(newSystemLog);
});

const updateSystemLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const systemlogId = parseInt(id, 10);

  if (isNaN(systemlogId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedSystemLog = await SystemLog.update(systemlogId, data);

  if (!updatedSystemLog) {
    return res.status(404).json({ message: 'SystemLog not found' });
  }

  res.json(updatedSystemLog);
});

const deleteSystemLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const systemlogId = parseInt(id, 10);

  if (isNaN(systemlogId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await SystemLog.delete(systemlogId);

  if (!deleted) {
    return res.status(404).json({ message: 'SystemLog not found' });
  }

  res.status(204).send();
});

module.exports = {
  getSystemLog,
  getSystemLogById,
  createSystemLog,
  updateSystemLog,
  deleteSystemLog,
};
