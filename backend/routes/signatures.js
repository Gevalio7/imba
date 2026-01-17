const express = require('express');
const router = express.Router();
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
router.post('/', createSignatures);

// PUT /signatures/:id
router.put('/:id', updateSignatures);

// DELETE /signatures/:id
router.delete('/:id', deleteSignatures);

module.exports = router;
