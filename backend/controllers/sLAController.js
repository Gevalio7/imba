const SLA = require('../models/sLA');

const getSLA = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await SLA.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getSLA:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getSLAById = async (req, res) => {
  try {
    const { id } = req.params;
    const slaId = parseInt(id, 10);

    if (isNaN(slaId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const sla = await SLA.getById(slaId);

    if (!sla) {
      return res.status(404).json({ message: 'SLA not found' });
    }

    res.json(sla);
  } catch (error) {
    console.error('Error in getSLAById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createSLA = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newSLA = await SLA.create({ name, description, status, isActive });

    res.status(201).json(newSLA);
  } catch (error) {
    console.error('Error in createSLA:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateSLA = async (req, res) => {
  try {
    const { id } = req.params;
    const slaId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(slaId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedSLA = await SLA.update(slaId, { name, description, status, isActive });

    if (!updatedSLA) {
      return res.status(404).json({ message: 'SLA not found' });
    }

    res.json(updatedSLA);
  } catch (error) {
    console.error('Error in updateSLA:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteSLA = async (req, res) => {
  try {
    const { id } = req.params;
    const slaId = parseInt(id, 10);

    if (isNaN(slaId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await SLA.delete(slaId);

    if (!deleted) {
      return res.status(404).json({ message: 'SLA not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteSLA:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getSLA,
  getSLAById,
  createSLA,
  updateSLA,
  deleteSLA,
};
