const express = require('express');
const router = express.Router();
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
router.post('/', createTypes);

// PUT /types/:id
router.put('/:id', updateTypes);

// DELETE /types/:id
router.delete('/:id', deleteTypes);

// Маршруты для связи типов и категорий
// POST /types/:id/categories - добавить категорию к типу
router.post('/:id/categories', typeCategoriesController.addCategoryToType);

// DELETE /types/:id/categories/:categoryId - удалить категорию из типа
router.delete('/:id/categories/:categoryId', typeCategoriesController.removeCategoryFromType);

module.exports = router;
