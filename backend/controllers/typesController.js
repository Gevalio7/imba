const Types = require('../models/types');
const { asyncHandler } = require('../middleware/errorHandler');

const getTypes = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Types.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getTypeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const typeId = parseInt(id, 10);

  if (isNaN(typeId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const type = await Types.getById(typeId);

  if (!type) {
    return res.status(404).json({ message: 'Type not found' });
  }

  res.json(type);
});

const createTypes = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.comment = req.body.comment;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newType = await Types.create(data);

  res.status(201).json(newType);
});

const updateTypes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const typeId = parseInt(id, 10);

  if (isNaN(typeId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.comment !== undefined) data.comment = req.body.comment;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedType = await Types.update(typeId, data);

  if (!updatedType) {
    return res.status(404).json({ message: 'Type not found' });
  }

  res.json(updatedType);
});

const deleteTypes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const typeId = parseInt(id, 10);

  if (isNaN(typeId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await Types.delete(typeId);

  if (!deleted) {
    return res.status(404).json({ message: 'Type not found' });
  }

  res.status(204).send();
});

module.exports = {
  getTypes,
  getTypeById,
  createTypes,
  updateTypes,
  deleteTypes,
};
