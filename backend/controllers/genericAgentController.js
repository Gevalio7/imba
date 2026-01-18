const GenericAgent = require('../models/genericAgent');

const getGenericAgent = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await GenericAgent.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getGenericAgent:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getGenericAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    const genericagentId = parseInt(id, 10);

    if (isNaN(genericagentId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const genericagent = await GenericAgent.getById(genericagentId);

    if (!genericagent) {
      return res.status(404).json({ message: 'GenericAgent not found' });
    }

    res.json(genericagent);
  } catch (error) {
    console.error('Error in getGenericAgentById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createGenericAgent = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newGenericAgent = await GenericAgent.create(data);

    res.status(201).json(newGenericAgent);
  } catch (error) {
    console.error('Error in createGenericAgent:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateGenericAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const genericagentId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(genericagentId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedGenericAgent = await GenericAgent.update(genericagentId, data);

    if (!updatedGenericAgent) {
      return res.status(404).json({ message: 'GenericAgent not found' });
    }

    res.json(updatedGenericAgent);
  } catch (error) {
    console.error('Error in updateGenericAgent:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteGenericAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const genericagentId = parseInt(id, 10);

    if (isNaN(genericagentId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await GenericAgent.delete(genericagentId);

    if (!deleted) {
      return res.status(404).json({ message: 'GenericAgent not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteGenericAgent:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getGenericAgent,
  getGenericAgentById,
  createGenericAgent,
  updateGenericAgent,
  deleteGenericAgent,
};
