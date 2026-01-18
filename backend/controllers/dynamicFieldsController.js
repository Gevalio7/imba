const DynamicFields = require('../models/dynamicFields');

const getDynamicFields = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await DynamicFields.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getDynamicFields:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getDynamicFieldById = async (req, res) => {
  try {
    const { id } = req.params;
    const dynamicfieldId = parseInt(id, 10);

    if (isNaN(dynamicfieldId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const dynamicfield = await DynamicFields.getById(dynamicfieldId);

    if (!dynamicfield) {
      return res.status(404).json({ message: 'DynamicField not found' });
    }

    res.json(dynamicfield);
  } catch (error) {
    console.error('Error in getDynamicFieldById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createDynamicFields = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.label = req.body.label;
    data.fieldType = req.body.fieldType;
    data.defaultValue = req.body.defaultValue;
    data.isRequired = req.body.isRequired;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newDynamicField = await DynamicFields.create(data);

    res.status(201).json(newDynamicField);
  } catch (error) {
    console.error('Error in createDynamicFields:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateDynamicFields = async (req, res) => {
  try {
    const { id } = req.params;
    const dynamicfieldId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.label = req.body.label;
    data.fieldType = req.body.fieldType;
    data.defaultValue = req.body.defaultValue;
    data.isRequired = req.body.isRequired;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(dynamicfieldId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedDynamicField = await DynamicFields.update(dynamicfieldId, data);

    if (!updatedDynamicField) {
      return res.status(404).json({ message: 'DynamicField not found' });
    }

    res.json(updatedDynamicField);
  } catch (error) {
    console.error('Error in updateDynamicFields:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteDynamicFields = async (req, res) => {
  try {
    const { id } = req.params;
    const dynamicfieldId = parseInt(id, 10);

    if (isNaN(dynamicfieldId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await DynamicFields.delete(dynamicfieldId);

    if (!deleted) {
      return res.status(404).json({ message: 'DynamicField not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteDynamicFields:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getDynamicFields,
  getDynamicFieldById,
  createDynamicFields,
  updateDynamicFields,
  deleteDynamicFields,
};
