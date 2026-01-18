const CommunicationLog = require('../models/communicationLog');
const { asyncHandler } = require('../middleware/errorHandler');

const getCommunicationLog = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await CommunicationLog.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getCommunicationLogById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const communicationlogId = parseInt(id, 10);

  if (isNaN(communicationlogId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const communicationlog = await CommunicationLog.getById(communicationlogId);

  if (!communicationlog) {
    return res.status(404).json({ message: 'CommunicationLog not found' });
  }

  res.json(communicationlog);
});

const createCommunicationLog = asyncHandler(async (req, res) => {
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

  const newCommunicationLog = await CommunicationLog.create(data);

  res.status(201).json(newCommunicationLog);
});

const updateCommunicationLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const communicationlogId = parseInt(id, 10);

  if (isNaN(communicationlogId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedCommunicationLog = await CommunicationLog.update(communicationlogId, data);

  if (!updatedCommunicationLog) {
    return res.status(404).json({ message: 'CommunicationLog not found' });
  }

  res.json(updatedCommunicationLog);
});

const deleteCommunicationLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const communicationlogId = parseInt(id, 10);

  if (isNaN(communicationlogId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await CommunicationLog.delete(communicationlogId);

  if (!deleted) {
    return res.status(404).json({ message: 'CommunicationLog not found' });
  }

  res.status(204).send();
});

module.exports = {
  getCommunicationLog,
  getCommunicationLogById,
  createCommunicationLog,
  updateCommunicationLog,
  deleteCommunicationLog,
};
