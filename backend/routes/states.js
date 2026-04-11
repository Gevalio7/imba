const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
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
router.post('/', protect, createStates);

// PUT /states/:id
router.put('/:id', protect, updateStates);

// DELETE /states/:id
router.delete('/:id', protect, deleteStates);

module.exports = router;
