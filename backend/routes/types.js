const express = require('express');
const router = express.Router();
const {
  getTypes,
  getTypeById,
  createTypes,
  updateTypes,
  deleteTypes,
} = require('../controllers/typesController');

// GET /types - список с query params
router.get('/', getTypes);

// GET /types/:id
router.get('/:id', getTypeById);

// POST /types
router.post('/', createTypes);

// PUT /types/:id
router.put('/:id', updateTypes);

// DELETE /types/:id
router.delete('/:id', deleteTypes);

module.exports = router;
