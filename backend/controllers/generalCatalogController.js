const GeneralCatalog = require('../models/generalCatalog');

const getGeneralCatalog = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await GeneralCatalog.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getGeneralCatalog:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getGeneralCatalogById = async (req, res) => {
  try {
    const { id } = req.params;
    const generalcatalogId = parseInt(id, 10);

    if (isNaN(generalcatalogId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const generalcatalog = await GeneralCatalog.getById(generalcatalogId);

    if (!generalcatalog) {
      return res.status(404).json({ message: 'GeneralCatalog not found' });
    }

    res.json(generalcatalog);
  } catch (error) {
    console.error('Error in getGeneralCatalogById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createGeneralCatalog = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newGeneralCatalog = await GeneralCatalog.create(data);

    res.status(201).json(newGeneralCatalog);
  } catch (error) {
    console.error('Error in createGeneralCatalog:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateGeneralCatalog = async (req, res) => {
  try {
    const { id } = req.params;
    const generalcatalogId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(generalcatalogId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedGeneralCatalog = await GeneralCatalog.update(generalcatalogId, data);

    if (!updatedGeneralCatalog) {
      return res.status(404).json({ message: 'GeneralCatalog not found' });
    }

    res.json(updatedGeneralCatalog);
  } catch (error) {
    console.error('Error in updateGeneralCatalog:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteGeneralCatalog = async (req, res) => {
  try {
    const { id } = req.params;
    const generalcatalogId = parseInt(id, 10);

    if (isNaN(generalcatalogId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await GeneralCatalog.delete(generalcatalogId);

    if (!deleted) {
      return res.status(404).json({ message: 'GeneralCatalog not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteGeneralCatalog:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getGeneralCatalog,
  getGeneralCatalogById,
  createGeneralCatalog,
  updateGeneralCatalog,
  deleteGeneralCatalog,
};
