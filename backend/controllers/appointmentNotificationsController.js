const AppointmentNotifications = require('../models/appointmentNotifications');
const { asyncHandler } = require('../middleware/errorHandler');

const getAppointmentNotifications = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await AppointmentNotifications.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getAppointmentNotificationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appointmentnotificationId = parseInt(id, 10);

  if (isNaN(appointmentnotificationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const appointmentnotification = await AppointmentNotifications.getById(appointmentnotificationId);

  if (!appointmentnotification) {
    return res.status(404).json({ message: 'AppointmentNotification not found' });
  }

  res.json(appointmentnotification);
});

const createAppointmentNotifications = asyncHandler(async (req, res) => {
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

  const newAppointmentNotification = await AppointmentNotifications.create(data);

  res.status(201).json(newAppointmentNotification);
});

const updateAppointmentNotifications = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appointmentnotificationId = parseInt(id, 10);

  if (isNaN(appointmentnotificationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedAppointmentNotification = await AppointmentNotifications.update(appointmentnotificationId, data);

  if (!updatedAppointmentNotification) {
    return res.status(404).json({ message: 'AppointmentNotification not found' });
  }

  res.json(updatedAppointmentNotification);
});

const deleteAppointmentNotifications = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appointmentnotificationId = parseInt(id, 10);

  if (isNaN(appointmentnotificationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await AppointmentNotifications.delete(appointmentnotificationId);

  if (!deleted) {
    return res.status(404).json({ message: 'AppointmentNotification not found' });
  }

  res.status(204).send();
});

module.exports = {
  getAppointmentNotifications,
  getAppointmentNotificationById,
  createAppointmentNotifications,
  updateAppointmentNotifications,
  deleteAppointmentNotifications,
};
