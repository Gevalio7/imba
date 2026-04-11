const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSessionManagement,
  getSessionManagementById,
  createSessionManagement,
  updateSessionManagement,
  deleteSessionManagement,
} = require('../controllers/sessionManagementController');

// GET /sessionManagement - список с query params
router.get('/', getSessionManagement);

// GET /sessionManagement/:id
router.get('/:id', getSessionManagementById);

// POST /sessionManagement
router.post('/', protect, createSessionManagement);

// PUT /sessionManagement/:id
router.put('/:id', protect, updateSessionManagement);

// DELETE /sessionManagement/:id
router.delete('/:id', protect, deleteSessionManagement);

module.exports = router;
