const SystemMaintenance = require('../models/systemMaintenance');
const { asyncHandler } = require('../middleware/errorHandler');

const getSystemMaintenance = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await SystemMaintenance.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getSystemMaintenanceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const systemmaintenanceId = parseInt(id, 10);

  if (isNaN(systemmaintenanceId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const systemmaintenance = await SystemMaintenance.getById(systemmaintenanceId);

  if (!systemmaintenance) {
    return res.status(404).json({ message: 'SystemMaintenance not found' });
  }

  res.json(systemmaintenance);
});

const createSystemMaintenance = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.description = req.body.description;
  data.startTime = req.body.startTime;
  data.endTime = req.body.endTime;
  data.isScheduled = req.body.isScheduled;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newSystemMaintenance = await SystemMaintenance.create(data);

  res.status(201).json(newSystemMaintenance);
});

const updateSystemMaintenance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const systemmaintenanceId = parseInt(id, 10);

  if (isNaN(systemmaintenanceId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.description !== undefined) data.description = req.body.description;
  if (req.body.startTime !== undefined) data.startTime = req.body.startTime;
  if (req.body.endTime !== undefined) data.endTime = req.body.endTime;
  if (req.body.isScheduled !== undefined) data.isScheduled = req.body.isScheduled;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedSystemMaintenance = await SystemMaintenance.update(systemmaintenanceId, data);

  if (!updatedSystemMaintenance) {
    return res.status(404).json({ message: 'SystemMaintenance not found' });
  }

  res.json(updatedSystemMaintenance);
});

const deleteSystemMaintenance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const systemmaintenanceId = parseInt(id, 10);

  if (isNaN(systemmaintenanceId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await SystemMaintenance.delete(systemmaintenanceId);

  if (!deleted) {
    return res.status(404).json({ message: 'SystemMaintenance not found' });
  }

  res.status(204).send();
});

module.exports = {
  getSystemMaintenance,
  getSystemMaintenanceById,
  createSystemMaintenance,
  updateSystemMaintenance,
  deleteSystemMaintenance,
};
