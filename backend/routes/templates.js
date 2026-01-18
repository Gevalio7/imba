const express = require('express');
const router = express.Router();
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
router.post('/', createTemplates);

// PUT /templates/:id
router.put('/:id', updateTemplates);

// DELETE /templates/:id
router.delete('/:id', deleteTemplates);

module.exports = router;
