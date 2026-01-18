const SystemMaintenance = require('../models/systemMaintenance');

const getSystemMaintenance = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await SystemMaintenance.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getSystemMaintenance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getSystemMaintenanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const systemmaintenanceId = parseInt(id, 10);

    if (isNaN(systemmaintenanceId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const systemmaintenance = await SystemMaintenance.getById(systemmaintenanceId);

    if (!systemmaintenance) {
      return res.status(404).json({ message: 'SystemMaintenance not found' });
    }

    res.json(systemmaintenance);
  } catch (error) {
    console.error('Error in getSystemMaintenanceById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createSystemMaintenance = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newSystemMaintenance = await SystemMaintenance.create(data);

    res.status(201).json(newSystemMaintenance);
  } catch (error) {
    console.error('Error in createSystemMaintenance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateSystemMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const systemmaintenanceId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(systemmaintenanceId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedSystemMaintenance = await SystemMaintenance.update(systemmaintenanceId, data);

    if (!updatedSystemMaintenance) {
      return res.status(404).json({ message: 'SystemMaintenance not found' });
    }

    res.json(updatedSystemMaintenance);
  } catch (error) {
    console.error('Error in updateSystemMaintenance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteSystemMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const systemmaintenanceId = parseInt(id, 10);

    if (isNaN(systemmaintenanceId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await SystemMaintenance.delete(systemmaintenanceId);

    if (!deleted) {
      return res.status(404).json({ message: 'SystemMaintenance not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteSystemMaintenance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getSystemMaintenance,
  getSystemMaintenanceById,
  createSystemMaintenance,
  updateSystemMaintenance,
  deleteSystemMaintenance,
};
