const PackageManager = require('../models/packageManager');

const getPackageManager = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await PackageManager.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getPackageManager:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getPackageManagerById = async (req, res) => {
  try {
    const { id } = req.params;
    const packagemanagerId = parseInt(id, 10);

    if (isNaN(packagemanagerId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const packagemanager = await PackageManager.getById(packagemanagerId);

    if (!packagemanager) {
      return res.status(404).json({ message: 'PackageManager not found' });
    }

    res.json(packagemanager);
  } catch (error) {
    console.error('Error in getPackageManagerById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createPackageManager = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newPackageManager = await PackageManager.create({ name, description, status, isActive });

    res.status(201).json(newPackageManager);
  } catch (error) {
    console.error('Error in createPackageManager:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updatePackageManager = async (req, res) => {
  try {
    const { id } = req.params;
    const packagemanagerId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(packagemanagerId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedPackageManager = await PackageManager.update(packagemanagerId, { name, description, status, isActive });

    if (!updatedPackageManager) {
      return res.status(404).json({ message: 'PackageManager not found' });
    }

    res.json(updatedPackageManager);
  } catch (error) {
    console.error('Error in updatePackageManager:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deletePackageManager = async (req, res) => {
  try {
    const { id } = req.params;
    const packagemanagerId = parseInt(id, 10);

    if (isNaN(packagemanagerId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await PackageManager.delete(packagemanagerId);

    if (!deleted) {
      return res.status(404).json({ message: 'PackageManager not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deletePackageManager:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getPackageManager,
  getPackageManagerById,
  createPackageManager,
  updatePackageManager,
  deletePackageManager,
};
