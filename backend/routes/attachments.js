const express = require('express');
const router = express.Router();
const {
  getAttachments,
  getAttachmentById,
  createAttachments,
  updateAttachments,
  deleteAttachments,
  downloadAttachment,
  upload,
} = require('../controllers/attachmentsController');

// GET /attachments - список с query params
router.get('/', getAttachments);

// GET /attachments/:id
router.get('/:id', getAttachmentById);

// POST /attachments
router.post('/', upload.single('file'), createAttachments);

// PUT /attachments/:id
router.put('/:id', updateAttachments);

// DELETE /attachments/:id
router.delete('/:id', deleteAttachments);

// GET /attachments/:id/download
router.get('/:id/download', downloadAttachment);

module.exports = router;
