const SystemFileSupport = require('../models/systemFileSupport');

const getSystemFileSupport = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await SystemFileSupport.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getSystemFileSupport:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getSystemFileSupportById = async (req, res) => {
  try {
    const { id } = req.params;
    const systemfilesupportId = parseInt(id, 10);

    if (isNaN(systemfilesupportId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const systemfilesupport = await SystemFileSupport.getById(systemfilesupportId);

    if (!systemfilesupport) {
      return res.status(404).json({ message: 'SystemFileSupport not found' });
    }

    res.json(systemfilesupport);
  } catch (error) {
    console.error('Error in getSystemFileSupportById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createSystemFileSupport = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newSystemFileSupport = await SystemFileSupport.create({ name, description, status, isActive });

    res.status(201).json(newSystemFileSupport);
  } catch (error) {
    console.error('Error in createSystemFileSupport:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateSystemFileSupport = async (req, res) => {
  try {
    const { id } = req.params;
    const systemfilesupportId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(systemfilesupportId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedSystemFileSupport = await SystemFileSupport.update(systemfilesupportId, { name, description, status, isActive });

    if (!updatedSystemFileSupport) {
      return res.status(404).json({ message: 'SystemFileSupport not found' });
    }

    res.json(updatedSystemFileSupport);
  } catch (error) {
    console.error('Error in updateSystemFileSupport:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteSystemFileSupport = async (req, res) => {
  try {
    const { id } = req.params;
    const systemfilesupportId = parseInt(id, 10);

    if (isNaN(systemfilesupportId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await SystemFileSupport.delete(systemfilesupportId);

    if (!deleted) {
      return res.status(404).json({ message: 'SystemFileSupport not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteSystemFileSupport:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getSystemFileSupport,
  getSystemFileSupportById,
  createSystemFileSupport,
  updateSystemFileSupport,
  deleteSystemFileSupport,
};
