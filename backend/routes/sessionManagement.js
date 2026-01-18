const express = require('express');
const router = express.Router();
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
router.post('/', createSessionManagement);

// PUT /sessionManagement/:id
router.put('/:id', updateSessionManagement);

// DELETE /sessionManagement/:id
router.delete('/:id', deleteSessionManagement);

module.exports = router;
