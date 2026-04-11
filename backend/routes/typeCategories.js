const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const typeCategoriesController = require('../controllers/typeCategoriesController');

// Маршруты для категорий типов
router.get('/', typeCategoriesController.getTypeCategories);
router.get('/with-types', typeCategoriesController.getTypesWithCategories);
router.get('/:id', typeCategoriesController.getTypeCategoryById);
router.post('/', protect, typeCategoriesController.createTypeCategory);
router.put('/:id', protect, typeCategoriesController.updateTypeCategory);
router.delete('/:id', protect, typeCategoriesController.deleteTypeCategory);

// Маршруты для связи типов и категорий
router.post('/:id/categories', protect, typeCategoriesController.addCategoryToType);
router.delete('/:id/categories/:categoryId', protect, typeCategoriesController.removeCategoryFromType);

module.exports = router;
