const SessionManagement = require('../models/sessionManagement');

const getSessionManagement = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getSessionManagement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getSessionManagementById = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getSessionManagementById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createSessionManagement = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newSessionManagement = await SessionManagement.create({ name, description, status, isActive });

    res.status(201).json(newSessionManagement);
  } catch (error) {
    console.error('Error in createSessionManagement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateSessionManagement = async (req, res) => {
  try {
    const { id } = req.params;
    const sessionmanagementId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(sessionmanagementId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedSessionManagement = await SessionManagement.update(sessionmanagementId, { name, description, status, isActive });

    if (!updatedSessionManagement) {
      return res.status(404).json({ message: 'SessionManagement not found' });
    }

    res.json(updatedSessionManagement);
  } catch (error) {
    console.error('Error in updateSessionManagement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteSessionManagement = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in deleteSessionManagement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getSessionManagement,
  getSessionManagementById,
  createSessionManagement,
  updateSessionManagement,
  deleteSessionManagement,
};
