const TestEntities = require('../models/testEntities');
const { asyncHandler } = require('../middleware/errorHandler');

const getTestEntities = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await TestEntities.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getTestEntityById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const testentityId = parseInt(id, 10);

  if (isNaN(testentityId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const testentity = await TestEntities.getById(testentityId);

  if (!testentity) {
    return res.status(404).json({ message: 'TestEntity not found' });
  }

  res.json(testentity);
});

const createTestEntities = asyncHandler(async (req, res) => {
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

  const newTestEntity = await TestEntities.create(data);

  res.status(201).json(newTestEntity);
});

const updateTestEntities = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const testentityId = parseInt(id, 10);

  if (isNaN(testentityId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.comment !== undefined) data.comment = req.body.comment;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedTestEntity = await TestEntities.update(testentityId, data);

  if (!updatedTestEntity) {
    return res.status(404).json({ message: 'TestEntity not found' });
  }

  res.json(updatedTestEntity);
});

const deleteTestEntities = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const testentityId = parseInt(id, 10);

  if (isNaN(testentityId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await TestEntities.delete(testentityId);

  if (!deleted) {
    return res.status(404).json({ message: 'TestEntity not found' });
  }

  res.status(204).send();
});

module.exports = {
  getTestEntities,
  getTestEntityById,
  createTestEntities,
  updateTestEntities,
  deleteTestEntities,
};
