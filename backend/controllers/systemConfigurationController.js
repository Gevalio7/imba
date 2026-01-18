const SystemConfiguration = require('../models/systemConfiguration');

const getSystemConfiguration = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await SystemConfiguration.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getSystemConfiguration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getSystemConfigurationById = async (req, res) => {
  try {
    const { id } = req.params;
    const systemconfigurationId = parseInt(id, 10);

    if (isNaN(systemconfigurationId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const systemconfiguration = await SystemConfiguration.getById(systemconfigurationId);

    if (!systemconfiguration) {
      return res.status(404).json({ message: 'SystemConfiguration not found' });
    }

    res.json(systemconfiguration);
  } catch (error) {
    console.error('Error in getSystemConfigurationById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createSystemConfiguration = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.value = req.body.value;
    data.configType = req.body.configType;
    data.isEditable = req.body.isEditable;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newSystemConfiguration = await SystemConfiguration.create(data);

    res.status(201).json(newSystemConfiguration);
  } catch (error) {
    console.error('Error in createSystemConfiguration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateSystemConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const systemconfigurationId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.value = req.body.value;
    data.configType = req.body.configType;
    data.isEditable = req.body.isEditable;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(systemconfigurationId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedSystemConfiguration = await SystemConfiguration.update(systemconfigurationId, data);

    if (!updatedSystemConfiguration) {
      return res.status(404).json({ message: 'SystemConfiguration not found' });
    }

    res.json(updatedSystemConfiguration);
  } catch (error) {
    console.error('Error in updateSystemConfiguration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteSystemConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const systemconfigurationId = parseInt(id, 10);

    if (isNaN(systemconfigurationId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await SystemConfiguration.delete(systemconfigurationId);

    if (!deleted) {
      return res.status(404).json({ message: 'SystemConfiguration not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteSystemConfiguration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getSystemConfiguration,
  getSystemConfigurationById,
  createSystemConfiguration,
  updateSystemConfiguration,
  deleteSystemConfiguration,
};
