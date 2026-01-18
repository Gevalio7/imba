const DynamicFieldsScreens = require('../models/dynamicFieldsScreens');
const { asyncHandler } = require('../middleware/errorHandler');

const getDynamicFieldsScreens = asyncHandler(async (req, res) => {
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
});

const getDynamicFieldsScreenById = asyncHandler(async (req, res) => {
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
});

const createDynamicFieldsScreens = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.screenName = req.body.screenName;
  data.fieldName = req.body.fieldName;
  data.fieldType = req.body.fieldType;
  data.isRequired = req.body.isRequired;
  data.position = req.body.position;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newDynamicFieldsScreen = await DynamicFieldsScreens.create(data);

  res.status(201).json(newDynamicFieldsScreen);
});

const updateDynamicFieldsScreens = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const dynamicfieldsscreenId = parseInt(id, 10);

  if (isNaN(dynamicfieldsscreenId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.screenName !== undefined) data.screenName = req.body.screenName;
  if (req.body.fieldName !== undefined) data.fieldName = req.body.fieldName;
  if (req.body.fieldType !== undefined) data.fieldType = req.body.fieldType;
  if (req.body.isRequired !== undefined) data.isRequired = req.body.isRequired;
  if (req.body.position !== undefined) data.position = req.body.position;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedDynamicFieldsScreen = await DynamicFieldsScreens.update(dynamicfieldsscreenId, data);

  if (!updatedDynamicFieldsScreen) {
    return res.status(404).json({ message: 'DynamicFieldsScreen not found' });
  }

  res.json(updatedDynamicFieldsScreen);
});

const deleteDynamicFieldsScreens = asyncHandler(async (req, res) => {
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
});

module.exports = {
  getDynamicFieldsScreens,
  getDynamicFieldsScreenById,
  createDynamicFieldsScreens,
  updateDynamicFieldsScreens,
  deleteDynamicFieldsScreens,
};
