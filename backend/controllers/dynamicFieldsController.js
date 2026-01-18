const DynamicFields = require('../models/dynamicFields');
const { asyncHandler } = require('../middleware/errorHandler');

const getDynamicFields = asyncHandler(async (req, res) => {
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
});

const getDynamicFieldById = asyncHandler(async (req, res) => {
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
});

const createDynamicFields = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.label = req.body.label;
  data.fieldType = req.body.fieldType;
  data.defaultValue = req.body.defaultValue;
  data.isRequired = req.body.isRequired;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newDynamicField = await DynamicFields.create(data);

  res.status(201).json(newDynamicField);
});

const updateDynamicFields = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const dynamicfieldId = parseInt(id, 10);

  if (isNaN(dynamicfieldId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.label !== undefined) data.label = req.body.label;
  if (req.body.fieldType !== undefined) data.fieldType = req.body.fieldType;
  if (req.body.defaultValue !== undefined) data.defaultValue = req.body.defaultValue;
  if (req.body.isRequired !== undefined) data.isRequired = req.body.isRequired;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedDynamicField = await DynamicFields.update(dynamicfieldId, data);

  if (!updatedDynamicField) {
    return res.status(404).json({ message: 'DynamicField not found' });
  }

  res.json(updatedDynamicField);
});

const deleteDynamicFields = asyncHandler(async (req, res) => {
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
});

module.exports = {
  getDynamicFields,
  getDynamicFieldById,
  createDynamicFields,
  updateDynamicFields,
  deleteDynamicFields,
};
