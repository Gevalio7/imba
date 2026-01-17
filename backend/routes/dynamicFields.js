const express = require('express');
const router = express.Router();
const {
  getDynamicFields,
  getDynamicFieldById,
  createDynamicFields,
  updateDynamicFields,
  deleteDynamicFields,
} = require('../controllers/dynamicFieldsController');

// GET /dynamicFields - список с query params
router.get('/', getDynamicFields);

// GET /dynamicFields/:id
router.get('/:id', getDynamicFieldById);

// POST /dynamicFields
router.post('/', createDynamicFields);

// PUT /dynamicFields/:id
router.put('/:id', updateDynamicFields);

// DELETE /dynamicFields/:id
router.delete('/:id', deleteDynamicFields);

module.exports = router;
