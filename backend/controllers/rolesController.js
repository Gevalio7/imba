const Roles = require('../models/roles');

const getRoles = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await Roles.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getRoles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const roleId = parseInt(id, 10);

    if (isNaN(roleId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const role = await Roles.getById(roleId);

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.json(role);
  } catch (error) {
    console.error('Error in getRoleById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createRoles = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newRole = await Roles.create(data);

    res.status(201).json(newRole);
  } catch (error) {
    console.error('Error in createRoles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateRoles = async (req, res) => {
  try {
    const { id } = req.params;
    const roleId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(roleId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedRole = await Roles.update(roleId, data);

    if (!updatedRole) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.json(updatedRole);
  } catch (error) {
    console.error('Error in updateRoles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteRoles = async (req, res) => {
  try {
    const { id } = req.params;
    const roleId = parseInt(id, 10);

    if (isNaN(roleId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await Roles.delete(roleId);

    if (!deleted) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteRoles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getRoles,
  getRoleById,
  createRoles,
  updateRoles,
  deleteRoles,
};
