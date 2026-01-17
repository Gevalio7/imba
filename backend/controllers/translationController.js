const Translation = require('../models/translation');

const getTranslation = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await Translation.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getTranslation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getTranslationById = async (req, res) => {
  try {
    const { id } = req.params;
    const translationId = parseInt(id, 10);

    if (isNaN(translationId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const translation = await Translation.getById(translationId);

    if (!translation) {
      return res.status(404).json({ message: 'Translation not found' });
    }

    res.json(translation);
  } catch (error) {
    console.error('Error in getTranslationById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createTranslation = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newTranslation = await Translation.create({ name, description, status, isActive });

    res.status(201).json(newTranslation);
  } catch (error) {
    console.error('Error in createTranslation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    const translationId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(translationId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedTranslation = await Translation.update(translationId, { name, description, status, isActive });

    if (!updatedTranslation) {
      return res.status(404).json({ message: 'Translation not found' });
    }

    res.json(updatedTranslation);
  } catch (error) {
    console.error('Error in updateTranslation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    const translationId = parseInt(id, 10);

    if (isNaN(translationId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await Translation.delete(translationId);

    if (!deleted) {
      return res.status(404).json({ message: 'Translation not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteTranslation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getTranslation,
  getTranslationById,
  createTranslation,
  updateTranslation,
  deleteTranslation,
};
