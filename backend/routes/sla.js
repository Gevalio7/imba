const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
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
router.post('/', protect, checkPermission('menu_sla_write'), createSla);

// PUT /sla/:id
router.put('/:id', protect, checkPermission('menu_sla_write'), updateSla);

// DELETE /sla/:id
router.delete('/:id', protect, checkPermission('menu_sla_delete'), deleteSla);

module.exports = router;
