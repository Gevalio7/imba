const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const {
  getStates,
  getStateById,
  createStates,
  updateStates,
  deleteStates,
} = require('../controllers/statesController');

// GET /states - список с query params
router.get('/', getStates);

// GET /states/:id
router.get('/:id', getStateById);

// POST /states
router.post('/', protect, checkPermission('menu_states_write'), createStates);

// PUT /states/:id
router.put('/:id', protect, checkPermission('menu_states_write'), updateStates);

// DELETE /states/:id
router.delete('/:id', protect, checkPermission('menu_states_delete'), deleteStates);

module.exports = router;
