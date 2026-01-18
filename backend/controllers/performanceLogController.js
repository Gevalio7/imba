const PerformanceLog = require('../models/performanceLog');
const { asyncHandler } = require('../middleware/errorHandler');

const getPerformanceLog = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await PerformanceLog.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getPerformanceLogById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const performancelogId = parseInt(id, 10);

  if (isNaN(performancelogId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const performancelog = await PerformanceLog.getById(performancelogId);

  if (!performancelog) {
    return res.status(404).json({ message: 'PerformanceLog not found' });
  }

  res.json(performancelog);
});

const createPerformanceLog = asyncHandler(async (req, res) => {
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

  const newPerformanceLog = await PerformanceLog.create(data);

  res.status(201).json(newPerformanceLog);
});

const updatePerformanceLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const performancelogId = parseInt(id, 10);

  if (isNaN(performancelogId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedPerformanceLog = await PerformanceLog.update(performancelogId, data);

  if (!updatedPerformanceLog) {
    return res.status(404).json({ message: 'PerformanceLog not found' });
  }

  res.json(updatedPerformanceLog);
});

const deletePerformanceLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const performancelogId = parseInt(id, 10);

  if (isNaN(performancelogId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await PerformanceLog.delete(performancelogId);

  if (!deleted) {
    return res.status(404).json({ message: 'PerformanceLog not found' });
  }

  res.status(204).send();
});

module.exports = {
  getPerformanceLog,
  getPerformanceLogById,
  createPerformanceLog,
  updatePerformanceLog,
  deletePerformanceLog,
};
