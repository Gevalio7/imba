const PackageManager = require('../models/packageManager');
const { asyncHandler } = require('../middleware/errorHandler');

const getPackageManager = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await PackageManager.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getPackageManagerById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const packagemanagerId = parseInt(id, 10);

  if (isNaN(packagemanagerId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const packagemanager = await PackageManager.getById(packagemanagerId);

  if (!packagemanager) {
    return res.status(404).json({ message: 'PackageManager not found' });
  }

  res.json(packagemanager);
});

const createPackageManager = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.description = req.body.description;
  data.version = req.body.version;
  data.author = req.body.author;
  data.isInstalled = req.body.isInstalled;
  data.isUpgradable = req.body.isUpgradable;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newPackageManager = await PackageManager.create(data);

  res.status(201).json(newPackageManager);
});

const updatePackageManager = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const packagemanagerId = parseInt(id, 10);

  if (isNaN(packagemanagerId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.description !== undefined) data.description = req.body.description;
  if (req.body.version !== undefined) data.version = req.body.version;
  if (req.body.author !== undefined) data.author = req.body.author;
  if (req.body.isInstalled !== undefined) data.isInstalled = req.body.isInstalled;
  if (req.body.isUpgradable !== undefined) data.isUpgradable = req.body.isUpgradable;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedPackageManager = await PackageManager.update(packagemanagerId, data);

  if (!updatedPackageManager) {
    return res.status(404).json({ message: 'PackageManager not found' });
  }

  res.json(updatedPackageManager);
});

const deletePackageManager = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const packagemanagerId = parseInt(id, 10);

  if (isNaN(packagemanagerId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await PackageManager.delete(packagemanagerId);

  if (!deleted) {
    return res.status(404).json({ message: 'PackageManager not found' });
  }

  res.status(204).send();
});

module.exports = {
  getPackageManager,
  getPackageManagerById,
  createPackageManager,
  updatePackageManager,
  deletePackageManager,
};
