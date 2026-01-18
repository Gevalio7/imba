const AdminNotifications = require('../models/adminNotifications');
const { asyncHandler } = require('../middleware/errorHandler');

const getAdminNotifications = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await AdminNotifications.getAll({
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

  const adminnotification = await AdminNotifications.getById(adminnotificationId);

  if (!adminnotification) {
    return res.status(404).json({ message: 'AdminNotification not found' });
  }

  res.json(adminnotification);
});

const createAdminNotifications = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.description = req.body.description;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newAdminNotification = await AdminNotifications.create(data);

  res.status(201).json(newAdminNotification);
});

const updateAdminNotifications = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminnotificationId = parseInt(id, 10);

  if (isNaN(adminnotificationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.description !== undefined) data.description = req.body.description;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedAdminNotification = await AdminNotifications.update(adminnotificationId, data);

  if (!updatedAdminNotification) {
    return res.status(404).json({ message: 'AdminNotification not found' });
  }

  res.json(updatedAdminNotification);
});

const deleteAdminNotifications = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminnotificationId = parseInt(id, 10);

  if (isNaN(adminnotificationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await AdminNotifications.delete(adminnotificationId);

  if (!deleted) {
    return res.status(404).json({ message: 'AdminNotification not found' });
  }

  res.status(204).send();
});

module.exports = {
  getAdminNotifications,
  getAdminNotificationById,
  createAdminNotifications,
  updateAdminNotifications,
  deleteAdminNotifications,
};
