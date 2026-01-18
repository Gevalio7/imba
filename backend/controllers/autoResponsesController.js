const AutoResponses = require('../models/autoResponses');

const getAutoResponses = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await AutoResponses.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getAutoResponses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAutoResponseById = async (req, res) => {
  try {
    const { id } = req.params;
    const autoresponseId = parseInt(id, 10);

    if (isNaN(autoresponseId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const autoresponse = await AutoResponses.getById(autoresponseId);

    if (!autoresponse) {
      return res.status(404).json({ message: 'AutoResponse not found' });
    }

    res.json(autoresponse);
  } catch (error) {
    console.error('Error in getAutoResponseById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createAutoResponses = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.trigger = req.body.trigger;
    data.response = req.body.response;
    data.delay = req.body.delay;
    data.status = req.body.status;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newAutoResponse = await AutoResponses.create(data);

    res.status(201).json(newAutoResponse);
  } catch (error) {
    console.error('Error in createAutoResponses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateAutoResponses = async (req, res) => {
  try {
    const { id } = req.params;
    const autoresponseId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.trigger = req.body.trigger;
    data.response = req.body.response;
    data.delay = req.body.delay;
    data.status = req.body.status;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(autoresponseId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedAutoResponse = await AutoResponses.update(autoresponseId, data);

    if (!updatedAutoResponse) {
      return res.status(404).json({ message: 'AutoResponse not found' });
    }

    res.json(updatedAutoResponse);
  } catch (error) {
    console.error('Error in updateAutoResponses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteAutoResponses = async (req, res) => {
  try {
    const { id } = req.params;
    const autoresponseId = parseInt(id, 10);

    if (isNaN(autoresponseId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await AutoResponses.delete(autoresponseId);

    if (!deleted) {
      return res.status(404).json({ message: 'AutoResponse not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteAutoResponses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAutoResponses,
  getAutoResponseById,
  createAutoResponses,
  updateAutoResponses,
  deleteAutoResponses,
};
