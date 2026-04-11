const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSystemConfiguration,
  getSystemConfigurationById,
  createSystemConfiguration,
  updateSystemConfiguration,
  deleteSystemConfiguration,
} = require('../controllers/systemConfigurationController');

// GET /systemConfiguration - список с query params
router.get('/', getSystemConfiguration);

// GET /systemConfiguration/:id
router.get('/:id', getSystemConfigurationById);

// POST /systemConfiguration
router.post('/', protect, createSystemConfiguration);

// PUT /systemConfiguration/:id
router.put('/:id', protect, updateSystemConfiguration);

// DELETE /systemConfiguration/:id
router.delete('/:id', protect, deleteSystemConfiguration);

module.exports = router;
