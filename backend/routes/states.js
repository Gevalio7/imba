const express = require('express');
const router = express.Router();
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
router.post('/', createStates);

// PUT /states/:id
router.put('/:id', updateStates);

// DELETE /states/:id
router.delete('/:id', deleteStates);

module.exports = router;
