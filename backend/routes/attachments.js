const express = require('express');
const router = express.Router();
const multer = require('multer');
const multerUpload = multer({ dest: 'uploads/' });
const { protect } = require('../middleware/auth');
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
router.post('/', protect, multerUpload.single('file'), createAttachments);

// PUT /attachments/:id
router.put('/:id', protect, updateAttachments);

// DELETE /attachments/:id
router.delete('/:id', protect, deleteAttachments);

// GET /attachments/:id/download
router.get('/:id/download', downloadAttachment);

module.exports = router;
