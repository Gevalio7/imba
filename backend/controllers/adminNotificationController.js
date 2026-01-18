const AdminNotification = require('../models/adminNotification');

const getAdminNotification = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getAdminNotification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAdminNotificationById = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getAdminNotificationById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createAdminNotification = async (req, res) => {
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

    const newAdminNotification = await AdminNotification.create(data);

    res.status(201).json(newAdminNotification);
  } catch (error) {
    console.error('Error in createAdminNotification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateAdminNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const adminnotificationId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.message = req.body.message;
    data.status = req.body.status;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(adminnotificationId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedAdminNotification = await AdminNotification.update(adminnotificationId, data);

    if (!updatedAdminNotification) {
      return res.status(404).json({ message: 'AdminNotification not found' });
    }

    res.json(updatedAdminNotification);
  } catch (error) {
    console.error('Error in updateAdminNotification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteAdminNotification = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in deleteAdminNotification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAdminNotification,
  getAdminNotificationById,
  createAdminNotification,
  updateAdminNotification,
  deleteAdminNotification,
};
