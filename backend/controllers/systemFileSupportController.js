const SystemFileSupport = require('../models/systemFileSupport');
const { asyncHandler } = require('../middleware/errorHandler');

const getSystemFileSupport = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await SystemFileSupport.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getSystemFileSupportById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const systemfilesupportId = parseInt(id, 10);

  if (isNaN(systemfilesupportId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const systemfilesupport = await SystemFileSupport.getById(systemfilesupportId);

  if (!systemfilesupport) {
    return res.status(404).json({ message: 'SystemFileSupport not found' });
  }

  res.json(systemfilesupport);
});

const createSystemFileSupport = asyncHandler(async (req, res) => {
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

  const newSystemFileSupport = await SystemFileSupport.create(data);

  res.status(201).json(newSystemFileSupport);
});

const updateSystemFileSupport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const systemfilesupportId = parseInt(id, 10);

  if (isNaN(systemfilesupportId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedSystemFileSupport = await SystemFileSupport.update(systemfilesupportId, data);

  if (!updatedSystemFileSupport) {
    return res.status(404).json({ message: 'SystemFileSupport not found' });
  }

  res.json(updatedSystemFileSupport);
});

const deleteSystemFileSupport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const systemfilesupportId = parseInt(id, 10);

  if (isNaN(systemfilesupportId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await SystemFileSupport.delete(systemfilesupportId);

  if (!deleted) {
    return res.status(404).json({ message: 'SystemFileSupport not found' });
  }

  res.status(204).send();
});

module.exports = {
  getSystemFileSupport,
  getSystemFileSupportById,
  createSystemFileSupport,
  updateSystemFileSupport,
  deleteSystemFileSupport,
};
