const Queues = require('../models/queues');

const getQueues = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await Queues.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getQueues:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getQueueById = async (req, res) => {
  try {
    const { id } = req.params;
    const queueId = parseInt(id, 10);

    if (isNaN(queueId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const queue = await Queues.getById(queueId);

    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    res.json(queue);
  } catch (error) {
    console.error('Error in getQueueById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createQueues = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newQueue = await Queues.create({ name, description, status, isActive });

    res.status(201).json(newQueue);
  } catch (error) {
    console.error('Error in createQueues:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateQueues = async (req, res) => {
  try {
    const { id } = req.params;
    const queueId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(queueId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedQueue = await Queues.update(queueId, { name, description, status, isActive });

    if (!updatedQueue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    res.json(updatedQueue);
  } catch (error) {
    console.error('Error in updateQueues:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteQueues = async (req, res) => {
  try {
    const { id } = req.params;
    const queueId = parseInt(id, 10);

    if (isNaN(queueId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await Queues.delete(queueId);

    if (!deleted) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteQueues:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getQueues,
  getQueueById,
  createQueues,
  updateQueues,
  deleteQueues,
};
