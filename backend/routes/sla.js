const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSla,
  getSlaById,
  createSla,
  updateSla,
  deleteSla,
} = require('../controllers/slaController');

// GET /sla - список с query params
router.get('/', getSla);

// GET /sla/:id
router.get('/:id', getSlaById);

// POST /sla
router.post('/', protect, createSla);

// PUT /sla/:id
router.put('/:id', protect, updateSla);

// DELETE /sla/:id
router.delete('/:id', protect, deleteSla);

module.exports = router;
