const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
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
router.post('/', protect, checkPermission('system_settings'), createTypes);

// PUT /types/:id
router.put('/:id', protect, checkPermission('system_settings'), updateTypes);

// DELETE /types/:id
router.delete('/:id', protect, checkPermission('system_settings'), deleteTypes);

// Маршруты для связи типов и категорий
// POST /types/:id/categories - добавить категорию к типу
router.post('/:id/categories', protect, checkPermission('system_settings'), typeCategoriesController.addCategoryToType);

// DELETE /types/:id/categories/:categoryId - удалить категорию из типа
router.delete('/:id/categories/:categoryId', protect, checkPermission('system_settings'), typeCategoriesController.removeCategoryFromType);

module.exports = router;
