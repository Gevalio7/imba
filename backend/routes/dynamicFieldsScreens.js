const express = require('express');
const router = express.Router();
const {
  getDynamicFieldsScreens,
  getDynamicFieldsScreenById,
  createDynamicFieldsScreens,
  updateDynamicFieldsScreens,
  deleteDynamicFieldsScreens,
} = require('../controllers/dynamicFieldsScreensController');

// GET /dynamicFieldsScreens - список с query params
router.get('/', getDynamicFieldsScreens);

// GET /dynamicFieldsScreens/:id
router.get('/:id', getDynamicFieldsScreenById);

// POST /dynamicFieldsScreens
router.post('/', createDynamicFieldsScreens);

// PUT /dynamicFieldsScreens/:id
router.put('/:id', updateDynamicFieldsScreens);

// DELETE /dynamicFieldsScreens/:id
router.delete('/:id', deleteDynamicFieldsScreens);

module.exports = router;
