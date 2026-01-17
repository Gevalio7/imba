const QueueAutoResponse = require('../models/queueAutoResponse');

const getQueueAutoResponse = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await QueueAutoResponse.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getQueueAutoResponse:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getQueueAutoResponseById = async (req, res) => {
  try {
    const { id } = req.params;
    const queueautoresponseId = parseInt(id, 10);

    if (isNaN(queueautoresponseId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const queueautoresponse = await QueueAutoResponse.getById(queueautoresponseId);

    if (!queueautoresponse) {
      return res.status(404).json({ message: 'QueueAutoResponse not found' });
    }

    res.json(queueautoresponse);
  } catch (error) {
    console.error('Error in getQueueAutoResponseById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createQueueAutoResponse = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newQueueAutoResponse = await QueueAutoResponse.create({ name, description, status, isActive });

    res.status(201).json(newQueueAutoResponse);
  } catch (error) {
    console.error('Error in createQueueAutoResponse:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateQueueAutoResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const queueautoresponseId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(queueautoresponseId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedQueueAutoResponse = await QueueAutoResponse.update(queueautoresponseId, { name, description, status, isActive });

    if (!updatedQueueAutoResponse) {
      return res.status(404).json({ message: 'QueueAutoResponse not found' });
    }

    res.json(updatedQueueAutoResponse);
  } catch (error) {
    console.error('Error in updateQueueAutoResponse:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteQueueAutoResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const queueautoresponseId = parseInt(id, 10);

    if (isNaN(queueautoresponseId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await QueueAutoResponse.delete(queueautoresponseId);

    if (!deleted) {
      return res.status(404).json({ message: 'QueueAutoResponse not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteQueueAutoResponse:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getQueueAutoResponse,
  getQueueAutoResponseById,
  createQueueAutoResponse,
  updateQueueAutoResponse,
  deleteQueueAutoResponse,
};
