const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSignatures,
  getSignatureById,
  createSignatures,
  updateSignatures,
  deleteSignatures,
} = require('../controllers/signaturesController');

// GET /signatures - список с query params
router.get('/', getSignatures);

// GET /signatures/:id
router.get('/:id', getSignatureById);

// POST /signatures
router.post('/', protect, createSignatures);

// PUT /signatures/:id
router.put('/:id', protect, updateSignatures);

// DELETE /signatures/:id
router.delete('/:id', protect, deleteSignatures);

module.exports = router;
