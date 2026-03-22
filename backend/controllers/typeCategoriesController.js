const TypeCategories = require('../models/typeCategories');
const Types = require('../models/types');
const { asyncHandler } = require('../middleware/errorHandler');

const getTypeCategories = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 1000;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await TypeCategories.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getTypeCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const categoryId = parseInt(id, 10);

  if (isNaN(categoryId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const category = await TypeCategories.getById(categoryId);

  if (!category) {
    return res.status(404).json({ message: 'TypeCategory not found' });
  }

  res.json(category);
});

const createTypeCategory = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.laborHours = req.body.laborHours || 0;
  
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  } else {
    data.isActive = true;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newCategory = await TypeCategories.create(data);

  res.status(201).json(newCategory);
});

const updateTypeCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const categoryId = parseInt(id, 10);

  if (isNaN(categoryId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.laborHours !== undefined) data.laborHours = req.body.laborHours;
  if (req.body.isActive !== undefined) data.isActive = req.body.isActive;

  const updatedCategory = await TypeCategories.update(categoryId, data);

  if (!updatedCategory) {
    return res.status(404).json({ message: 'TypeCategory not found' });
  }

  res.json(updatedCategory);
});

const deleteTypeCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const categoryId = parseInt(id, 10);

  if (isNaN(categoryId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await TypeCategories.delete(categoryId);

  if (!deleted) {
    return res.status(404).json({ message: 'TypeCategory not found' });
  }

  res.status(204).send();
});

// Получить все типы с их категориями
const getTypesWithCategories = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 1000;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Types.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
    includeCategories: true,
  });

  res.json(result);
});

// Добавить категорию к типу
const addCategoryToType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { categoryId } = req.body;
  const typeId = parseInt(id, 10);
  const categoryIdNum = parseInt(categoryId, 10);

  if (isNaN(typeId) || isNaN(categoryIdNum)) {
    return res.status(400).json({ message: 'Invalid IDs' });
  }

  // Проверяем существование типа
  const type = await Types.getById(typeId);
  if (!type) {
    return res.status(404).json({ message: 'Type not found' });
  }

  // Проверяем существование категории
  const category = await TypeCategories.getById(categoryIdNum);
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  // Получаем текущие categoryIds или создаем пустой массив
  const currentCategoryIds = type.categoryIds || [];
  
  // Проверяем, не добавля ли уже эта категория
  if (currentCategoryIds.includes(categoryIdNum)) {
    return res.status(400).json({ message: 'Category already added to this type' });
  }

  // Добавляем категорию (без повторов)
  const newCategoryIds = [...currentCategoryIds, categoryIdNum];
  
  await Types.update(typeId, { categoryIds: newCategoryIds });
  
  res.status(201).json({ message: 'Category added to type' });
});

// Удалить категорию из типа
const removeCategoryFromType = asyncHandler(async (req, res) => {
  const { id, categoryId } = req.params;
  const typeId = parseInt(id, 10);
  const categoryIdNum = parseInt(categoryId, 10);

  if (isNaN(typeId) || isNaN(categoryIdNum)) {
    return res.status(400).json({ message: 'Invalid IDs' });
  }

  // Получаем тип
  const type = await Types.getById(typeId);
  if (!type) {
    return res.status(404).json({ message: 'Type not found' });
  }

  // Получаем текущие categoryIds
  const currentCategoryIds = type.categoryIds || [];
  
  // Удаляем категорию
  const newCategoryIds = currentCategoryIds.filter(cid => cid !== categoryIdNum);
  
  await Types.update(typeId, { categoryIds: newCategoryIds });
  
  res.status(204).send();
});

module.exports = {
  getTypeCategories,
  getTypeCategoryById,
  createTypeCategory,
  updateTypeCategory,
  deleteTypeCategory,
  getTypesWithCategories,
  addCategoryToType,
  removeCategoryFromType,
};
