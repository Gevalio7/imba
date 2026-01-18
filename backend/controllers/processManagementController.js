const ProcessManagement = require('../models/processManagement');

const getProcessManagement = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await ProcessManagement.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getProcessManagement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getProcessManagementById = async (req, res) => {
  try {
    const { id } = req.params;
    const processmanagementId = parseInt(id, 10);

    if (isNaN(processmanagementId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const processmanagement = await ProcessManagement.getById(processmanagementId);

    if (!processmanagement) {
      return res.status(404).json({ message: 'ProcessManagement not found' });
    }

    res.json(processmanagement);
  } catch (error) {
    console.error('Error in getProcessManagementById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createProcessManagement = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newProcessManagement = await ProcessManagement.create(data);

    res.status(201).json(newProcessManagement);
  } catch (error) {
    console.error('Error in createProcessManagement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateProcessManagement = async (req, res) => {
  try {
    const { id } = req.params;
    const processmanagementId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(processmanagementId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedProcessManagement = await ProcessManagement.update(processmanagementId, data);

    if (!updatedProcessManagement) {
      return res.status(404).json({ message: 'ProcessManagement not found' });
    }

    res.json(updatedProcessManagement);
  } catch (error) {
    console.error('Error in updateProcessManagement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteProcessManagement = async (req, res) => {
  try {
    const { id } = req.params;
    const processmanagementId = parseInt(id, 10);

    if (isNaN(processmanagementId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await ProcessManagement.delete(processmanagementId);

    if (!deleted) {
      return res.status(404).json({ message: 'ProcessManagement not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteProcessManagement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getProcessManagement,
  getProcessManagementById,
  createProcessManagement,
  updateProcessManagement,
  deleteProcessManagement,
};
