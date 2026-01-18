const SystemLog = require('../models/systemLog');

const getSystemLog = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await SystemLog.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getSystemLog:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getSystemLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const systemlogId = parseInt(id, 10);

    if (isNaN(systemlogId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const systemlog = await SystemLog.getById(systemlogId);

    if (!systemlog) {
      return res.status(404).json({ message: 'SystemLog not found' });
    }

    res.json(systemlog);
  } catch (error) {
    console.error('Error in getSystemLogById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createSystemLog = async (req, res) => {
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

    const newSystemLog = await SystemLog.create(data);

    res.status(201).json(newSystemLog);
  } catch (error) {
    console.error('Error in createSystemLog:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateSystemLog = async (req, res) => {
  try {
    const { id } = req.params;
    const systemlogId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.message = req.body.message;
    data.status = req.body.status;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(systemlogId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedSystemLog = await SystemLog.update(systemlogId, data);

    if (!updatedSystemLog) {
      return res.status(404).json({ message: 'SystemLog not found' });
    }

    res.json(updatedSystemLog);
  } catch (error) {
    console.error('Error in updateSystemLog:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteSystemLog = async (req, res) => {
  try {
    const { id } = req.params;
    const systemlogId = parseInt(id, 10);

    if (isNaN(systemlogId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await SystemLog.delete(systemlogId);

    if (!deleted) {
      return res.status(404).json({ message: 'SystemLog not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteSystemLog:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getSystemLog,
  getSystemLogById,
  createSystemLog,
  updateSystemLog,
  deleteSystemLog,
};
