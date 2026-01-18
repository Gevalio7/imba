const SupportDataCollector = require('../models/supportDataCollector');
const { asyncHandler } = require('../middleware/errorHandler');

const getSupportDataCollector = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await SupportDataCollector.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getSupportDataCollectorById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const supportdatacollectorId = parseInt(id, 10);

  if (isNaN(supportdatacollectorId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const supportdatacollector = await SupportDataCollector.getById(supportdatacollectorId);

  if (!supportdatacollector) {
    return res.status(404).json({ message: 'SupportDataCollector not found' });
  }

  res.json(supportdatacollector);
});

const createSupportDataCollector = asyncHandler(async (req, res) => {
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

  const newSupportDataCollector = await SupportDataCollector.create(data);

  res.status(201).json(newSupportDataCollector);
});

const updateSupportDataCollector = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const supportdatacollectorId = parseInt(id, 10);

  if (isNaN(supportdatacollectorId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedSupportDataCollector = await SupportDataCollector.update(supportdatacollectorId, data);

  if (!updatedSupportDataCollector) {
    return res.status(404).json({ message: 'SupportDataCollector not found' });
  }

  res.json(updatedSupportDataCollector);
});

const deleteSupportDataCollector = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const supportdatacollectorId = parseInt(id, 10);

  if (isNaN(supportdatacollectorId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await SupportDataCollector.delete(supportdatacollectorId);

  if (!deleted) {
    return res.status(404).json({ message: 'SupportDataCollector not found' });
  }

  res.status(204).send();
});

module.exports = {
  getSupportDataCollector,
  getSupportDataCollectorById,
  createSupportDataCollector,
  updateSupportDataCollector,
  deleteSupportDataCollector,
};
