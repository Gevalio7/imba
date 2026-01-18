const SqlBox = require('../models/sqlBox');
const { asyncHandler } = require('../middleware/errorHandler');

const getSqlBox = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await SqlBox.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getSqlBoxById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sqlboxId = parseInt(id, 10);

  if (isNaN(sqlboxId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const sqlbox = await SqlBox.getById(sqlboxId);

  if (!sqlbox) {
    return res.status(404).json({ message: 'SqlBox not found' });
  }

  res.json(sqlbox);
});

const createSqlBox = asyncHandler(async (req, res) => {
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

  const newSqlBox = await SqlBox.create(data);

  res.status(201).json(newSqlBox);
});

const updateSqlBox = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sqlboxId = parseInt(id, 10);

  if (isNaN(sqlboxId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedSqlBox = await SqlBox.update(sqlboxId, data);

  if (!updatedSqlBox) {
    return res.status(404).json({ message: 'SqlBox not found' });
  }

  res.json(updatedSqlBox);
});

const deleteSqlBox = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sqlboxId = parseInt(id, 10);

  if (isNaN(sqlboxId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await SqlBox.delete(sqlboxId);

  if (!deleted) {
    return res.status(404).json({ message: 'SqlBox not found' });
  }

  res.status(204).send();
});

module.exports = {
  getSqlBox,
  getSqlBoxById,
  createSqlBox,
  updateSqlBox,
  deleteSqlBox,
};
