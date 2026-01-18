const AdminNotification = require('../models/adminNotification');
const { asyncHandler } = require('../middleware/errorHandler');

const getAdminNotification = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await AdminNotification.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getAdminNotificationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminnotificationId = parseInt(id, 10);

  if (isNaN(adminnotificationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const adminnotification = await AdminNotification.getById(adminnotificationId);

  if (!adminnotification) {
    return res.status(404).json({ message: 'AdminNotification not found' });
  }

  res.json(adminnotification);
});

const createAdminNotification = asyncHandler(async (req, res) => {
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

  const newAdminNotification = await AdminNotification.create(data);

  res.status(201).json(newAdminNotification);
});

const updateAdminNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminnotificationId = parseInt(id, 10);

  if (isNaN(adminnotificationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedAdminNotification = await AdminNotification.update(adminnotificationId, data);

  if (!updatedAdminNotification) {
    return res.status(404).json({ message: 'AdminNotification not found' });
  }

  res.json(updatedAdminNotification);
});

const deleteAdminNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminnotificationId = parseInt(id, 10);

  if (isNaN(adminnotificationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await AdminNotification.delete(adminnotificationId);

  if (!deleted) {
    return res.status(404).json({ message: 'AdminNotification not found' });
  }

  res.status(204).send();
});

module.exports = {
  getAdminNotification,
  getAdminNotificationById,
  createAdminNotification,
  updateAdminNotification,
  deleteAdminNotification,
};
