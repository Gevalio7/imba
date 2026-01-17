const PerformanceLog = require('../models/performanceLog');

const getPerformanceLog = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await PerformanceLog.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getPerformanceLog:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getPerformanceLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const performancelogId = parseInt(id, 10);

    if (isNaN(performancelogId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const performancelog = await PerformanceLog.getById(performancelogId);

    if (!performancelog) {
      return res.status(404).json({ message: 'PerformanceLog not found' });
    }

    res.json(performancelog);
  } catch (error) {
    console.error('Error in getPerformanceLogById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createPerformanceLog = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newPerformanceLog = await PerformanceLog.create({ name, description, status, isActive });

    res.status(201).json(newPerformanceLog);
  } catch (error) {
    console.error('Error in createPerformanceLog:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updatePerformanceLog = async (req, res) => {
  try {
    const { id } = req.params;
    const performancelogId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(performancelogId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedPerformanceLog = await PerformanceLog.update(performancelogId, { name, description, status, isActive });

    if (!updatedPerformanceLog) {
      return res.status(404).json({ message: 'PerformanceLog not found' });
    }

    res.json(updatedPerformanceLog);
  } catch (error) {
    console.error('Error in updatePerformanceLog:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deletePerformanceLog = async (req, res) => {
  try {
    const { id } = req.params;
    const performancelogId = parseInt(id, 10);

    if (isNaN(performancelogId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await PerformanceLog.delete(performancelogId);

    if (!deleted) {
      return res.status(404).json({ message: 'PerformanceLog not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deletePerformanceLog:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getPerformanceLog,
  getPerformanceLogById,
  createPerformanceLog,
  updatePerformanceLog,
  deletePerformanceLog,
};
