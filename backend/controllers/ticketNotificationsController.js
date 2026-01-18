const TicketNotifications = require('../models/ticketNotifications');
const { asyncHandler } = require('../middleware/errorHandler');

const getTicketNotifications = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await TicketNotifications.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getTicketNotificationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticketnotificationId = parseInt(id, 10);

  if (isNaN(ticketnotificationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const ticketnotification = await TicketNotifications.getById(ticketnotificationId);

  if (!ticketnotification) {
    return res.status(404).json({ message: 'TicketNotification not found' });
  }

  res.json(ticketnotification);
});

const createTicketNotifications = asyncHandler(async (req, res) => {
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

  const newTicketNotification = await TicketNotifications.create(data);

  res.status(201).json(newTicketNotification);
});

const updateTicketNotifications = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticketnotificationId = parseInt(id, 10);

  if (isNaN(ticketnotificationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedTicketNotification = await TicketNotifications.update(ticketnotificationId, data);

  if (!updatedTicketNotification) {
    return res.status(404).json({ message: 'TicketNotification not found' });
  }

  res.json(updatedTicketNotification);
});

const deleteTicketNotifications = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticketnotificationId = parseInt(id, 10);

  if (isNaN(ticketnotificationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await TicketNotifications.delete(ticketnotificationId);

  if (!deleted) {
    return res.status(404).json({ message: 'TicketNotification not found' });
  }

  res.status(204).send();
});

module.exports = {
  getTicketNotifications,
  getTicketNotificationById,
  createTicketNotifications,
  updateTicketNotifications,
  deleteTicketNotifications,
};
