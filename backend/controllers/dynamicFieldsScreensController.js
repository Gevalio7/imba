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
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newDynamicFieldsScreen = await DynamicFieldsScreens.create(data);

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
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(dynamicfieldsscreenId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedDynamicFieldsScreen = await DynamicFieldsScreens.update(dynamicfieldsscreenId, data);

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
