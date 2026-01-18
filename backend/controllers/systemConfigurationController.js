const SystemConfiguration = require('../models/systemConfiguration');
const { asyncHandler } = require('../middleware/errorHandler');

const getSystemConfiguration = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await SystemConfiguration.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getSystemConfigurationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const systemconfigurationId = parseInt(id, 10);

  if (isNaN(systemconfigurationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const systemconfiguration = await SystemConfiguration.getById(systemconfigurationId);

  if (!systemconfiguration) {
    return res.status(404).json({ message: 'SystemConfiguration not found' });
  }

  res.json(systemconfiguration);
});

const createSystemConfiguration = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.description = req.body.description;
  data.value = req.body.value;
  data.configType = req.body.configType;
  data.isEditable = req.body.isEditable;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newSystemConfiguration = await SystemConfiguration.create(data);

  res.status(201).json(newSystemConfiguration);
});

const updateSystemConfiguration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const systemconfigurationId = parseInt(id, 10);

  if (isNaN(systemconfigurationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.description !== undefined) data.description = req.body.description;
  if (req.body.value !== undefined) data.value = req.body.value;
  if (req.body.configType !== undefined) data.configType = req.body.configType;
  if (req.body.isEditable !== undefined) data.isEditable = req.body.isEditable;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedSystemConfiguration = await SystemConfiguration.update(systemconfigurationId, data);

  if (!updatedSystemConfiguration) {
    return res.status(404).json({ message: 'SystemConfiguration not found' });
  }

  res.json(updatedSystemConfiguration);
});

const deleteSystemConfiguration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const systemconfigurationId = parseInt(id, 10);

  if (isNaN(systemconfigurationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await SystemConfiguration.delete(systemconfigurationId);

  if (!deleted) {
    return res.status(404).json({ message: 'SystemConfiguration not found' });
  }

  res.status(204).send();
});

module.exports = {
  getSystemConfiguration,
  getSystemConfigurationById,
  createSystemConfiguration,
  updateSystemConfiguration,
  deleteSystemConfiguration,
};
