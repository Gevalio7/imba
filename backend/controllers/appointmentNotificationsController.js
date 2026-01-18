const AppointmentNotifications = require('../models/appointmentNotifications');

const getAppointmentNotifications = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getAppointmentNotifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAppointmentNotificationById = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getAppointmentNotificationById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createAppointmentNotifications = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.message = req.body.message;
    data.status = req.body.status;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newAppointmentNotification = await AppointmentNotifications.create(data);

    res.status(201).json(newAppointmentNotification);
  } catch (error) {
    console.error('Error in createAppointmentNotifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateAppointmentNotifications = async (req, res) => {
  try {
    const { id } = req.params;
    const appointmentnotificationId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.message = req.body.message;
    data.status = req.body.status;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(appointmentnotificationId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedAppointmentNotification = await AppointmentNotifications.update(appointmentnotificationId, data);

    if (!updatedAppointmentNotification) {
      return res.status(404).json({ message: 'AppointmentNotification not found' });
    }

    res.json(updatedAppointmentNotification);
  } catch (error) {
    console.error('Error in updateAppointmentNotifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteAppointmentNotifications = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in deleteAppointmentNotifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAppointmentNotifications,
  getAppointmentNotificationById,
  createAppointmentNotifications,
  updateAppointmentNotifications,
  deleteAppointmentNotifications,
};
