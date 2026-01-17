const DynamicFieldsScreens = require('../models/dynamicFieldsScreens');

const getDynamicFieldsScreens = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await DynamicFieldsScreens.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getDynamicFieldsScreens:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getDynamicFieldsScreenById = async (req, res) => {
  try {
    const { id } = req.params;
    const dynamicfieldsscreenId = parseInt(id, 10);

    if (isNaN(dynamicfieldsscreenId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const dynamicfieldsscreen = await DynamicFieldsScreens.getById(dynamicfieldsscreenId);

    if (!dynamicfieldsscreen) {
      return res.status(404).json({ message: 'DynamicFieldsScreen not found' });
    }

    res.json(dynamicfieldsscreen);
  } catch (error) {
    console.error('Error in getDynamicFieldsScreenById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createDynamicFieldsScreens = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newDynamicFieldsScreen = await DynamicFieldsScreens.create({ name, description, status, isActive });

    res.status(201).json(newDynamicFieldsScreen);
  } catch (error) {
    console.error('Error in createDynamicFieldsScreens:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateDynamicFieldsScreens = async (req, res) => {
  try {
    const { id } = req.params;
    const dynamicfieldsscreenId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(dynamicfieldsscreenId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedDynamicFieldsScreen = await DynamicFieldsScreens.update(dynamicfieldsscreenId, { name, description, status, isActive });

    if (!updatedDynamicFieldsScreen) {
      return res.status(404).json({ message: 'DynamicFieldsScreen not found' });
    }

    res.json(updatedDynamicFieldsScreen);
  } catch (error) {
    console.error('Error in updateDynamicFieldsScreens:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteDynamicFieldsScreens = async (req, res) => {
  try {
    const { id } = req.params;
    const dynamicfieldsscreenId = parseInt(id, 10);

    if (isNaN(dynamicfieldsscreenId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await DynamicFieldsScreens.delete(dynamicfieldsscreenId);

    if (!deleted) {
      return res.status(404).json({ message: 'DynamicFieldsScreen not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteDynamicFieldsScreens:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getDynamicFieldsScreens,
  getDynamicFieldsScreenById,
  createDynamicFieldsScreens,
  updateDynamicFieldsScreens,
  deleteDynamicFieldsScreens,
};
