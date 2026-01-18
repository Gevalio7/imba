const Types = require('../models/types');

const getTypes = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await Types.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getTypes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const typeId = parseInt(id, 10);

    if (isNaN(typeId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const type = await Types.getById(typeId);

    if (!type) {
      return res.status(404).json({ message: 'Type not found' });
    }

    res.json(type);
  } catch (error) {
    console.error('Error in getTypeById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createTypes = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newType = await Types.create(data);

    res.status(201).json(newType);
  } catch (error) {
    console.error('Error in createTypes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateTypes = async (req, res) => {
  try {
    const { id } = req.params;
    const typeId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(typeId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedType = await Types.update(typeId, data);

    if (!updatedType) {
      return res.status(404).json({ message: 'Type not found' });
    }

    res.json(updatedType);
  } catch (error) {
    console.error('Error in updateTypes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteTypes = async (req, res) => {
  try {
    const { id } = req.params;
    const typeId = parseInt(id, 10);

    if (isNaN(typeId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await Types.delete(typeId);

    if (!deleted) {
      return res.status(404).json({ message: 'Type not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteTypes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getTypes,
  getTypeById,
  createTypes,
  updateTypes,
  deleteTypes,
};
