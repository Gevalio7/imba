const Priority = require('../models/priority');

const getPriorities = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await Priority.getAll({
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

    const priority = await Priority.getById(priorityId);

    if (!priority) {
      return res.status(404).json({ message: 'Priority not found' });
    }

    res.json(priority);
  } catch (error) {
    console.error('Error in getPriorityById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createPriority = async (req, res) => {
  try {
    const { name, color, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newPriority = await Priority.create({ name, color, status, isActive });

    res.status(201).json(newPriority);
  } catch (error) {
    console.error('Error in createPriority:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updatePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const priorityId = parseInt(id, 10);
    const { name, color, status, isActive } = req.body;

    if (isNaN(priorityId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedPriority = await Priority.update(priorityId, { name, color, status, isActive });

    if (!updatedPriority) {
      return res.status(404).json({ message: 'Priority not found' });
    }

    res.json(updatedPriority);
  } catch (error) {
    console.error('Error in updatePriority:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deletePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const priorityId = parseInt(id, 10);

    if (isNaN(priorityId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await Priority.delete(priorityId);

    if (!deleted) {
      return res.status(404).json({ message: 'Priority not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deletePriority:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getPriorities,
  getPriorityById,
  createPriority,
  updatePriority,
  deletePriority,
};
