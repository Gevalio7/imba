const Priorities = require('../models/priorities');

const getPriorities = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await Priorities.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getPriorities:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getPriorityById = async (req, res) => {
  try {
    const { id } = req.params;
    const priorityId = parseInt(id, 10);

    if (isNaN(priorityId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const priority = await Priorities.getById(priorityId);

    if (!priority) {
      return res.status(404).json({ message: 'Priority not found' });
    }

    res.json(priority);
  } catch (error) {
    console.error('Error in getPriorityById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createPriorities = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.color = req.body.color;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newPriority = await Priorities.create(data);

    res.status(201).json(newPriority);
  } catch (error) {
    console.error('Error in createPriorities:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updatePriorities = async (req, res) => {
  try {
    const { id } = req.params;
    const priorityId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.color = req.body.color;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(priorityId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedPriority = await Priorities.update(priorityId, data);

    if (!updatedPriority) {
      return res.status(404).json({ message: 'Priority not found' });
    }

    res.json(updatedPriority);
  } catch (error) {
    console.error('Error in updatePriorities:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deletePriorities = async (req, res) => {
  try {
    const { id } = req.params;
    const priorityId = parseInt(id, 10);

    if (isNaN(priorityId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await Priorities.delete(priorityId);

    if (!deleted) {
      return res.status(404).json({ message: 'Priority not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deletePriorities:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getPriorities,
  getPriorityById,
  createPriorities,
  updatePriorities,
  deletePriorities,
};
