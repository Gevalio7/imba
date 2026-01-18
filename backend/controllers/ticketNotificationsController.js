const TicketNotifications = require('../models/ticketNotifications');

const getTicketNotifications = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getTicketNotifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getTicketNotificationById = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getTicketNotificationById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createTicketNotifications = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newTicketNotification = await TicketNotifications.create(data);

    res.status(201).json(newTicketNotification);
  } catch (error) {
    console.error('Error in createTicketNotifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateTicketNotifications = async (req, res) => {
  try {
    const { id } = req.params;
    const ticketnotificationId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(ticketnotificationId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedTicketNotification = await TicketNotifications.update(ticketnotificationId, data);

    if (!updatedTicketNotification) {
      return res.status(404).json({ message: 'TicketNotification not found' });
    }

    res.json(updatedTicketNotification);
  } catch (error) {
    console.error('Error in updateTicketNotifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteTicketNotifications = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in deleteTicketNotifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getTicketNotifications,
  getTicketNotificationById,
  createTicketNotifications,
  updateTicketNotifications,
  deleteTicketNotifications,
};
