const express = require('express');
const router = express.Router();
const {
  getTemplateAttachments,
  getTemplateAttachmentById,
  createTemplateAttachments,
  updateTemplateAttachments,
  deleteTemplateAttachments,
} = require('../controllers/templateAttachmentsController');

// GET /templateAttachments - список с query params
router.get('/', getTemplateAttachments);

// GET /templateAttachments/:id
router.get('/:id', getTemplateAttachmentById);

// POST /templateAttachments
router.post('/', createTemplateAttachments);

// PUT /templateAttachments/:id
router.put('/:id', updateTemplateAttachments);

// DELETE /templateAttachments/:id
router.delete('/:id', deleteTemplateAttachments);

module.exports = router;
