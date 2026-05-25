const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')
const { checkPermission } = require('../middleware/permissions')

const {
  getTemplates,
  getTemplateById,
  createTemplates,
  updateTemplates,
  deleteTemplates,
  testTemplate,
} = require('../controllers/templatesController')

// GET /templates - список с query params
router.get('/', getTemplates)

// GET /templates/:id
router.get('/:id', getTemplateById)

// POST /templates
router.post('/', protect, checkPermission('menu_templates_write'), createTemplates)

// PUT /templates/:id
router.put('/:id', protect, checkPermission('menu_templates_write'), updateTemplates)

// DELETE /templates/:id
router.delete('/:id', protect, checkPermission('menu_templates_delete'), deleteTemplates)

// POST /templates/:id/test - тестовое письмо
router.post('/:id/test', protect, testTemplate)

module.exports = router
