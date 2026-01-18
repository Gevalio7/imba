const SessionManagement = require('../models/sessionManagement');
const { asyncHandler } = require('../middleware/errorHandler');

const getSessionManagement = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await SessionManagement.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getSessionManagementById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sessionmanagementId = parseInt(id, 10);

  if (isNaN(sessionmanagementId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const sessionmanagement = await SessionManagement.getById(sessionmanagementId);

  if (!sessionmanagement) {
    return res.status(404).json({ message: 'SessionManagement not found' });
  }

  res.json(sessionmanagement);
});

const createSessionManagement = asyncHandler(async (req, res) => {
  const data = {};
  data.username = req.body.username;
  data.ipAddress = req.body.ipAddress;
  data.userAgent = req.body.userAgent;
  data.loginTime = req.body.loginTime;
  data.lastActivity = req.body.lastActivity;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.username) {
    return res.status(400).json({ message: 'username is required' });
  }

  const newSessionManagement = await SessionManagement.create(data);

  res.status(201).json(newSessionManagement);
});

const updateSessionManagement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sessionmanagementId = parseInt(id, 10);

  if (isNaN(sessionmanagementId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.username !== undefined) data.username = req.body.username;
  if (req.body.ipAddress !== undefined) data.ipAddress = req.body.ipAddress;
  if (req.body.userAgent !== undefined) data.userAgent = req.body.userAgent;
  if (req.body.loginTime !== undefined) data.loginTime = req.body.loginTime;
  if (req.body.lastActivity !== undefined) data.lastActivity = req.body.lastActivity;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedSessionManagement = await SessionManagement.update(sessionmanagementId, data);

  if (!updatedSessionManagement) {
    return res.status(404).json({ message: 'SessionManagement not found' });
  }

  res.json(updatedSessionManagement);
});

const deleteSessionManagement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sessionmanagementId = parseInt(id, 10);

  if (isNaN(sessionmanagementId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await SessionManagement.delete(sessionmanagementId);

  if (!deleted) {
    return res.status(404).json({ message: 'SessionManagement not found' });
  }

  res.status(204).send();
});

module.exports = {
  getSessionManagement,
  getSessionManagementById,
  createSessionManagement,
  updateSessionManagement,
  deleteSessionManagement,
};
