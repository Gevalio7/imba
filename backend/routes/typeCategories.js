const express = require('express');
const router = express.Router();
const typeCategoriesController = require('../controllers/typeCategoriesController');

// Маршруты для категорий типов
router.get('/', typeCategoriesController.getTypeCategories);
router.get('/with-types', typeCategoriesController.getTypesWithCategories);
router.get('/:id', typeCategoriesController.getTypeCategoryById);
router.post('/', typeCategoriesController.createTypeCategory);
router.put('/:id', typeCategoriesController.updateTypeCategory);
router.delete('/:id', typeCategoriesController.deleteTypeCategory);

// Маршруты для связи типов и категорий
router.post('/:id/categories', typeCategoriesController.addCategoryToType);
router.delete('/:id/categories/:categoryId', typeCategoriesController.removeCategoryFromType);

module.exports = router;
