const express = require('express');
const router = express.Router();
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
router.post('/', createSla);

// PUT /sla/:id
router.put('/:id', updateSla);

// DELETE /sla/:id
router.delete('/:id', deleteSla);

module.exports = router;
