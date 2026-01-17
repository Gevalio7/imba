const express = require('express');
const router = express.Router();
const {
  getSystemMaintenance,
  getSystemMaintenanceById,
  createSystemMaintenance,
  updateSystemMaintenance,
  deleteSystemMaintenance,
} = require('../controllers/systemMaintenanceController');

// GET /systemMaintenance - список с query params
router.get('/', getSystemMaintenance);

// GET /systemMaintenance/:id
router.get('/:id', getSystemMaintenanceById);

// POST /systemMaintenance
router.post('/', createSystemMaintenance);

// PUT /systemMaintenance/:id
router.put('/:id', updateSystemMaintenance);

// DELETE /systemMaintenance/:id
router.delete('/:id', deleteSystemMaintenance);

module.exports = router;
