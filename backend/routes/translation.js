const express = require('express');
const router = express.Router();
const {
  getTranslation,
  getTranslationById,
  createTranslation,
  updateTranslation,
  deleteTranslation,
} = require('../controllers/translationController');

// GET /translation - список с query params
router.get('/', getTranslation);

// GET /translation/:id
router.get('/:id', getTranslationById);

// POST /translation
router.post('/', createTranslation);

// PUT /translation/:id
router.put('/:id', updateTranslation);

// DELETE /translation/:id
router.delete('/:id', deleteTranslation);

module.exports = router;
