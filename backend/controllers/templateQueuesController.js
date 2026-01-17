const TemplateQueues = require('../models/templateQueues');

const getTemplateQueues = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await TemplateQueues.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getTemplateQueues:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getTemplateQueueById = async (req, res) => {
  try {
    const { id } = req.params;
    const templatequeueId = parseInt(id, 10);

    if (isNaN(templatequeueId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const templatequeue = await TemplateQueues.getById(templatequeueId);

    if (!templatequeue) {
      return res.status(404).json({ message: 'TemplateQueue not found' });
    }

    res.json(templatequeue);
  } catch (error) {
    console.error('Error in getTemplateQueueById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createTemplateQueues = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newTemplateQueue = await TemplateQueues.create({ name, description, status, isActive });

    res.status(201).json(newTemplateQueue);
  } catch (error) {
    console.error('Error in createTemplateQueues:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateTemplateQueues = async (req, res) => {
  try {
    const { id } = req.params;
    const templatequeueId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(templatequeueId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedTemplateQueue = await TemplateQueues.update(templatequeueId, { name, description, status, isActive });

    if (!updatedTemplateQueue) {
      return res.status(404).json({ message: 'TemplateQueue not found' });
    }

    res.json(updatedTemplateQueue);
  } catch (error) {
    console.error('Error in updateTemplateQueues:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteTemplateQueues = async (req, res) => {
  try {
    const { id } = req.params;
    const templatequeueId = parseInt(id, 10);

    if (isNaN(templatequeueId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await TemplateQueues.delete(templatequeueId);

    if (!deleted) {
      return res.status(404).json({ message: 'TemplateQueue not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteTemplateQueues:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getTemplateQueues,
  getTemplateQueueById,
  createTemplateQueues,
  updateTemplateQueues,
  deleteTemplateQueues,
};
