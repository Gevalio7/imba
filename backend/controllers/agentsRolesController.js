const AgentsRoles = require('../models/agentsRoles');

const getAgentsRoles = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await AgentsRoles.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getAgentsRoles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAgentsRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const agentsroleId = parseInt(id, 10);

    if (isNaN(agentsroleId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const agentsrole = await AgentsRoles.getById(agentsroleId);

    if (!agentsrole) {
      return res.status(404).json({ message: 'AgentsRole not found' });
    }

    res.json(agentsrole);
  } catch (error) {
    console.error('Error in getAgentsRoleById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createAgentsRoles = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newAgentsRole = await AgentsRoles.create({ name, description, status, isActive });

    res.status(201).json(newAgentsRole);
  } catch (error) {
    console.error('Error in createAgentsRoles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateAgentsRoles = async (req, res) => {
  try {
    const { id } = req.params;
    const agentsroleId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(agentsroleId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedAgentsRole = await AgentsRoles.update(agentsroleId, { name, description, status, isActive });

    if (!updatedAgentsRole) {
      return res.status(404).json({ message: 'AgentsRole not found' });
    }

    res.json(updatedAgentsRole);
  } catch (error) {
    console.error('Error in updateAgentsRoles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteAgentsRoles = async (req, res) => {
  try {
    const { id } = req.params;
    const agentsroleId = parseInt(id, 10);

    if (isNaN(agentsroleId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await AgentsRoles.delete(agentsroleId);

    if (!deleted) {
      return res.status(404).json({ message: 'AgentsRole not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteAgentsRoles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAgentsRoles,
  getAgentsRoleById,
  createAgentsRoles,
  updateAgentsRoles,
  deleteAgentsRoles,
};
