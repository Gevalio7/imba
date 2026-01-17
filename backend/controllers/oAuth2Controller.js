const OAuth2 = require('../models/oAuth2');

const getOAuth2 = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await OAuth2.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getOAuth2:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getOAuth2ById = async (req, res) => {
  try {
    const { id } = req.params;
    const oauth2Id = parseInt(id, 10);

    if (isNaN(oauth2Id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const oauth2 = await OAuth2.getById(oauth2Id);

    if (!oauth2) {
      return res.status(404).json({ message: 'OAuth2 not found' });
    }

    res.json(oauth2);
  } catch (error) {
    console.error('Error in getOAuth2ById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createOAuth2 = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newOAuth2 = await OAuth2.create({ name, description, status, isActive });

    res.status(201).json(newOAuth2);
  } catch (error) {
    console.error('Error in createOAuth2:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateOAuth2 = async (req, res) => {
  try {
    const { id } = req.params;
    const oauth2Id = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(oauth2Id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedOAuth2 = await OAuth2.update(oauth2Id, { name, description, status, isActive });

    if (!updatedOAuth2) {
      return res.status(404).json({ message: 'OAuth2 not found' });
    }

    res.json(updatedOAuth2);
  } catch (error) {
    console.error('Error in updateOAuth2:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteOAuth2 = async (req, res) => {
  try {
    const { id } = req.params;
    const oauth2Id = parseInt(id, 10);

    if (isNaN(oauth2Id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await OAuth2.delete(oauth2Id);

    if (!deleted) {
      return res.status(404).json({ message: 'OAuth2 not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteOAuth2:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getOAuth2,
  getOAuth2ById,
  createOAuth2,
  updateOAuth2,
  deleteOAuth2,
};
