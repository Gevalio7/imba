const SupportDataCollector = require('../models/supportDataCollector');

const getSupportDataCollector = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await SupportDataCollector.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getSupportDataCollector:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getSupportDataCollectorById = async (req, res) => {
  try {
    const { id } = req.params;
    const supportdatacollectorId = parseInt(id, 10);

    if (isNaN(supportdatacollectorId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const supportdatacollector = await SupportDataCollector.getById(supportdatacollectorId);

    if (!supportdatacollector) {
      return res.status(404).json({ message: 'SupportDataCollector not found' });
    }

    res.json(supportdatacollector);
  } catch (error) {
    console.error('Error in getSupportDataCollectorById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createSupportDataCollector = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.message = req.body.message;
    data.status = req.body.status;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newSupportDataCollector = await SupportDataCollector.create(data);

    res.status(201).json(newSupportDataCollector);
  } catch (error) {
    console.error('Error in createSupportDataCollector:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateSupportDataCollector = async (req, res) => {
  try {
    const { id } = req.params;
    const supportdatacollectorId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.message = req.body.message;
    data.status = req.body.status;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(supportdatacollectorId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedSupportDataCollector = await SupportDataCollector.update(supportdatacollectorId, data);

    if (!updatedSupportDataCollector) {
      return res.status(404).json({ message: 'SupportDataCollector not found' });
    }

    res.json(updatedSupportDataCollector);
  } catch (error) {
    console.error('Error in updateSupportDataCollector:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteSupportDataCollector = async (req, res) => {
  try {
    const { id } = req.params;
    const supportdatacollectorId = parseInt(id, 10);

    if (isNaN(supportdatacollectorId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await SupportDataCollector.delete(supportdatacollectorId);

    if (!deleted) {
      return res.status(404).json({ message: 'SupportDataCollector not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteSupportDataCollector:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getSupportDataCollector,
  getSupportDataCollectorById,
  createSupportDataCollector,
  updateSupportDataCollector,
  deleteSupportDataCollector,
};
