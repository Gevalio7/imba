const Translation = require('../models/translation');
const { asyncHandler } = require('../middleware/errorHandler');

const getTranslation = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Translation.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getTranslationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const translationId = parseInt(id, 10);

  if (isNaN(translationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const translation = await Translation.getById(translationId);

  if (!translation) {
    return res.status(404).json({ message: 'Translation not found' });
  }

  res.json(translation);
});

const createTranslation = asyncHandler(async (req, res) => {
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

  const newTranslation = await Translation.create(data);

  res.status(201).json(newTranslation);
});

const updateTranslation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const translationId = parseInt(id, 10);

  if (isNaN(translationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedTranslation = await Translation.update(translationId, data);

  if (!updatedTranslation) {
    return res.status(404).json({ message: 'Translation not found' });
  }

  res.json(updatedTranslation);
});

const deleteTranslation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const translationId = parseInt(id, 10);

  if (isNaN(translationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await Translation.delete(translationId);

  if (!deleted) {
    return res.status(404).json({ message: 'Translation not found' });
  }

  res.status(204).send();
});

module.exports = {
  getTranslation,
  getTranslationById,
  createTranslation,
  updateTranslation,
  deleteTranslation,
};
