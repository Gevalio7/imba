const States = require('../models/states');

const getStates = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await States.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getStates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getStateById = async (req, res) => {
  try {
    const { id } = req.params;
    const stateId = parseInt(id, 10);

    if (isNaN(stateId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const state = await States.getById(stateId);

    if (!state) {
      return res.status(404).json({ message: 'State not found' });
    }

    res.json(state);
  } catch (error) {
    console.error('Error in getStateById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createStates = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.comment = req.body.comment;
    data.status = req.body.status;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newState = await States.create(data);

    res.status(201).json(newState);
  } catch (error) {
    console.error('Error in createStates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateStates = async (req, res) => {
  try {
    const { id } = req.params;
    const stateId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.comment = req.body.comment;
    data.status = req.body.status;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(stateId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedState = await States.update(stateId, data);

    if (!updatedState) {
      return res.status(404).json({ message: 'State not found' });
    }

    res.json(updatedState);
  } catch (error) {
    console.error('Error in updateStates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteStates = async (req, res) => {
  try {
    const { id } = req.params;
    const stateId = parseInt(id, 10);

    if (isNaN(stateId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await States.delete(stateId);

    if (!deleted) {
      return res.status(404).json({ message: 'State not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteStates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getStates,
  getStateById,
  createStates,
  updateStates,
  deleteStates,
};
