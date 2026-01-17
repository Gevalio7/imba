const RolesGroups = require('../models/rolesGroups');

const getRolesGroups = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await RolesGroups.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getRolesGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getRolesGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const rolesgroupId = parseInt(id, 10);

    if (isNaN(rolesgroupId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const rolesgroup = await RolesGroups.getById(rolesgroupId);

    if (!rolesgroup) {
      return res.status(404).json({ message: 'RolesGroup not found' });
    }

    res.json(rolesgroup);
  } catch (error) {
    console.error('Error in getRolesGroupById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createRolesGroups = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newRolesGroup = await RolesGroups.create({ name, description, status, isActive });

    res.status(201).json(newRolesGroup);
  } catch (error) {
    console.error('Error in createRolesGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateRolesGroups = async (req, res) => {
  try {
    const { id } = req.params;
    const rolesgroupId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(rolesgroupId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedRolesGroup = await RolesGroups.update(rolesgroupId, { name, description, status, isActive });

    if (!updatedRolesGroup) {
      return res.status(404).json({ message: 'RolesGroup not found' });
    }

    res.json(updatedRolesGroup);
  } catch (error) {
    console.error('Error in updateRolesGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteRolesGroups = async (req, res) => {
  try {
    const { id } = req.params;
    const rolesgroupId = parseInt(id, 10);

    if (isNaN(rolesgroupId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await RolesGroups.delete(rolesgroupId);

    if (!deleted) {
      return res.status(404).json({ message: 'RolesGroup not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteRolesGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getRolesGroups,
  getRolesGroupById,
  createRolesGroups,
  updateRolesGroups,
  deleteRolesGroups,
};
