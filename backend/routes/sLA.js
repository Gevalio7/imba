const express = require('express');
const router = express.Router();
const {
  getSLA,
  getSLAById,
  createSLA,
  updateSLA,
  deleteSLA,
} = require('../controllers/sLAController');

// GET /sLA - список с query params
router.get('/', getSLA);

// GET /sLA/:id
router.get('/:id', getSLAById);

// POST /sLA
router.post('/', createSLA);

// PUT /sLA/:id
router.put('/:id', updateSLA);

// DELETE /sLA/:id
router.delete('/:id', deleteSLA);

module.exports = router;
