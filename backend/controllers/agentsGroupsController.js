const AgentsGroups = require('../models/agentsGroups');

const getAgentsGroups = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await AgentsGroups.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getAgentsGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAgentsGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const agentsgroupId = parseInt(id, 10);

    if (isNaN(agentsgroupId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const agentsgroup = await AgentsGroups.getById(agentsgroupId);

    if (!agentsgroup) {
      return res.status(404).json({ message: 'AgentsGroup not found' });
    }

    res.json(agentsgroup);
  } catch (error) {
    console.error('Error in getAgentsGroupById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createAgentsGroups = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newAgentsGroup = await AgentsGroups.create({ name, description, status, isActive });

    res.status(201).json(newAgentsGroup);
  } catch (error) {
    console.error('Error in createAgentsGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateAgentsGroups = async (req, res) => {
  try {
    const { id } = req.params;
    const agentsgroupId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(agentsgroupId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedAgentsGroup = await AgentsGroups.update(agentsgroupId, { name, description, status, isActive });

    if (!updatedAgentsGroup) {
      return res.status(404).json({ message: 'AgentsGroup not found' });
    }

    res.json(updatedAgentsGroup);
  } catch (error) {
    console.error('Error in updateAgentsGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteAgentsGroups = async (req, res) => {
  try {
    const { id } = req.params;
    const agentsgroupId = parseInt(id, 10);

    if (isNaN(agentsgroupId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await AgentsGroups.delete(agentsgroupId);

    if (!deleted) {
      return res.status(404).json({ message: 'AgentsGroup not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteAgentsGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAgentsGroups,
  getAgentsGroupById,
  createAgentsGroups,
  updateAgentsGroups,
  deleteAgentsGroups,
};
