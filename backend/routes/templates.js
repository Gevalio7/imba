const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTemplates,
  getTemplateById,
  createTemplates,
  updateTemplates,
  deleteTemplates,
} = require('../controllers/templatesController');

// GET /templates - список с query params
router.get('/', getTemplates);

// GET /templates/:id
router.get('/:id', getTemplateById);

// POST /templates
router.post('/', protect, createTemplates);

// PUT /templates/:id
router.put('/:id', protect, updateTemplates);

// DELETE /templates/:id
router.delete('/:id', protect, deleteTemplates);

module.exports = router;
