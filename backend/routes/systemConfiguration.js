const express = require('express');
const router = express.Router();
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
router.post('/', createSystemConfiguration);

// PUT /systemConfiguration/:id
router.put('/:id', updateSystemConfiguration);

// DELETE /systemConfiguration/:id
router.delete('/:id', deleteSystemConfiguration);

module.exports = router;
