const CommunicationLog = require('../models/communicationLog');

const getCommunicationLog = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await CommunicationLog.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getCommunicationLog:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getCommunicationLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const communicationlogId = parseInt(id, 10);

    if (isNaN(communicationlogId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const communicationlog = await CommunicationLog.getById(communicationlogId);

    if (!communicationlog) {
      return res.status(404).json({ message: 'CommunicationLog not found' });
    }

    res.json(communicationlog);
  } catch (error) {
    console.error('Error in getCommunicationLogById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createCommunicationLog = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newCommunicationLog = await CommunicationLog.create(data);

    res.status(201).json(newCommunicationLog);
  } catch (error) {
    console.error('Error in createCommunicationLog:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateCommunicationLog = async (req, res) => {
  try {
    const { id } = req.params;
    const communicationlogId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(communicationlogId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedCommunicationLog = await CommunicationLog.update(communicationlogId, data);

    if (!updatedCommunicationLog) {
      return res.status(404).json({ message: 'CommunicationLog not found' });
    }

    res.json(updatedCommunicationLog);
  } catch (error) {
    console.error('Error in updateCommunicationLog:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteCommunicationLog = async (req, res) => {
  try {
    const { id } = req.params;
    const communicationlogId = parseInt(id, 10);

    if (isNaN(communicationlogId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await CommunicationLog.delete(communicationlogId);

    if (!deleted) {
      return res.status(404).json({ message: 'CommunicationLog not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteCommunicationLog:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getCommunicationLog,
  getCommunicationLogById,
  createCommunicationLog,
  updateCommunicationLog,
  deleteCommunicationLog,
};
