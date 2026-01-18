const PgpKeys = require('../models/pgpKeys');
const { asyncHandler } = require('../middleware/errorHandler');

const getPgpKeys = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await PgpKeys.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getPgpKeyById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const pgpkeyId = parseInt(id, 10);

  if (isNaN(pgpkeyId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const pgpkey = await PgpKeys.getById(pgpkeyId);

  if (!pgpkey) {
    return res.status(404).json({ message: 'PgpKey not found' });
  }

  res.json(pgpkey);
});

const createPgpKeys = asyncHandler(async (req, res) => {
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

  const newPgpKey = await PgpKeys.create(data);

  res.status(201).json(newPgpKey);
});

const updatePgpKeys = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const pgpkeyId = parseInt(id, 10);

  if (isNaN(pgpkeyId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedPgpKey = await PgpKeys.update(pgpkeyId, data);

  if (!updatedPgpKey) {
    return res.status(404).json({ message: 'PgpKey not found' });
  }

  res.json(updatedPgpKey);
});

const deletePgpKeys = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const pgpkeyId = parseInt(id, 10);

  if (isNaN(pgpkeyId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await PgpKeys.delete(pgpkeyId);

  if (!deleted) {
    return res.status(404).json({ message: 'PgpKey not found' });
  }

  res.status(204).send();
});

module.exports = {
  getPgpKeys,
  getPgpKeyById,
  createPgpKeys,
  updatePgpKeys,
  deletePgpKeys,
};
