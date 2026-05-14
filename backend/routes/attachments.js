const express = require('express');
const router = express.Router();
const multer = require('multer');
const multerUpload = multer({ dest: 'uploads/' });
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
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
router.post('/', protect, multerUpload.single('file'), checkPermission('menu_attachments_write'), createAttachments);

// PUT /attachments/:id
router.put('/:id', protect, checkPermission('menu_attachments_write'), updateAttachments);

// DELETE /attachments/:id
router.delete('/:id', protect, checkPermission('menu_attachments_delete'), deleteAttachments);

// GET /attachments/:id/download
router.get('/:id/download', downloadAttachment);

module.exports = router;
