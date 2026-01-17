const Agents = require('../models/agents');

const getAgents = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await Agents.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getAgents:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    const agentId = parseInt(id, 10);

    if (isNaN(agentId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const agent = await Agents.getById(agentId);

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json(agent);
  } catch (error) {
    console.error('Error in getAgentById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createAgents = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newAgent = await Agents.create({ name, description, status, isActive });

    res.status(201).json(newAgent);
  } catch (error) {
    console.error('Error in createAgents:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateAgents = async (req, res) => {
  try {
    const { id } = req.params;
    const agentId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(agentId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedAgent = await Agents.update(agentId, { name, description, status, isActive });

    if (!updatedAgent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json(updatedAgent);
  } catch (error) {
    console.error('Error in updateAgents:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteAgents = async (req, res) => {
  try {
    const { id } = req.params;
    const agentId = parseInt(id, 10);

    if (isNaN(agentId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await Agents.delete(agentId);

    if (!deleted) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteAgents:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAgents,
  getAgentById,
  createAgents,
  updateAgents,
  deleteAgents,
};
