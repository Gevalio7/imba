const AutoResponses = require('../models/autoResponses');
const { asyncHandler } = require('../middleware/errorHandler');

const getAutoResponses = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await AutoResponses.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getAutoResponseById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const autoresponseId = parseInt(id, 10);

  if (isNaN(autoresponseId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const autoresponse = await AutoResponses.getById(autoresponseId);

  if (!autoresponse) {
    return res.status(404).json({ message: 'AutoResponse not found' });
  }

  res.json(autoresponse);
});

const createAutoResponses = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.trigger = req.body.trigger;
  data.response = req.body.response;
  data.delay = req.body.delay;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newAutoResponse = await AutoResponses.create(data);

  res.status(201).json(newAutoResponse);
});

const updateAutoResponses = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const autoresponseId = parseInt(id, 10);

  if (isNaN(autoresponseId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.trigger !== undefined) data.trigger = req.body.trigger;
  if (req.body.response !== undefined) data.response = req.body.response;
  if (req.body.delay !== undefined) data.delay = req.body.delay;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedAutoResponse = await AutoResponses.update(autoresponseId, data);

  if (!updatedAutoResponse) {
    return res.status(404).json({ message: 'AutoResponse not found' });
  }

  res.json(updatedAutoResponse);
});

const deleteAutoResponses = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const autoresponseId = parseInt(id, 10);

  if (isNaN(autoresponseId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await AutoResponses.delete(autoresponseId);

  if (!deleted) {
    return res.status(404).json({ message: 'AutoResponse not found' });
  }

  res.status(204).send();
});

module.exports = {
  getAutoResponses,
  getAutoResponseById,
  createAutoResponses,
  updateAutoResponses,
  deleteAutoResponses,
};
