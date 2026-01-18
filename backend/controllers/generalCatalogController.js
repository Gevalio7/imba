const GeneralCatalog = require('../models/generalCatalog');
const { asyncHandler } = require('../middleware/errorHandler');

const getGeneralCatalog = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await GeneralCatalog.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getGeneralCatalogById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const generalcatalogId = parseInt(id, 10);

  if (isNaN(generalcatalogId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const generalcatalog = await GeneralCatalog.getById(generalcatalogId);

  if (!generalcatalog) {
    return res.status(404).json({ message: 'GeneralCatalog not found' });
  }

  res.json(generalcatalog);
});

const createGeneralCatalog = asyncHandler(async (req, res) => {
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

  const newGeneralCatalog = await GeneralCatalog.create(data);

  res.status(201).json(newGeneralCatalog);
});

const updateGeneralCatalog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const generalcatalogId = parseInt(id, 10);

  if (isNaN(generalcatalogId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedGeneralCatalog = await GeneralCatalog.update(generalcatalogId, data);

  if (!updatedGeneralCatalog) {
    return res.status(404).json({ message: 'GeneralCatalog not found' });
  }

  res.json(updatedGeneralCatalog);
});

const deleteGeneralCatalog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const generalcatalogId = parseInt(id, 10);

  if (isNaN(generalcatalogId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await GeneralCatalog.delete(generalcatalogId);

  if (!deleted) {
    return res.status(404).json({ message: 'GeneralCatalog not found' });
  }

  res.status(204).send();
});

module.exports = {
  getGeneralCatalog,
  getGeneralCatalogById,
  createGeneralCatalog,
  updateGeneralCatalog,
  deleteGeneralCatalog,
};
