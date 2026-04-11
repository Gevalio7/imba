const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTypes,
  getTypeById,
  createTypes,
  updateTypes,
  deleteTypes,
  getTypeWithWorkflow,
} = require('../controllers/typesController');
const typeCategoriesController = require('../controllers/typeCategoriesController');

// GET /types - список с query params
router.get('/', getTypes);

// GET /types/:id/workflow - получить тип с workflow и доступными статусами
router.get('/:id/workflow', getTypeWithWorkflow);

// GET /types/:id
router.get('/:id', getTypeById);

// POST /types
router.post('/', protect, createTypes);

// PUT /types/:id
router.put('/:id', protect, updateTypes);

// DELETE /types/:id
router.delete('/:id', protect, deleteTypes);

// Маршруты для связи типов и категорий
// POST /types/:id/categories - добавить категорию к типу
router.post('/:id/categories', protect, typeCategoriesController.addCategoryToType);

// DELETE /types/:id/categories/:categoryId - удалить категорию из типа
router.delete('/:id/categories/:categoryId', protect, typeCategoriesController.removeCategoryFromType);

module.exports = router;
