const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getPriorities,
  getPriorityById,
  createPriorities,
  updatePriorities,
  deletePriorities,
} = require('../controllers/prioritiesController');

// GET /priorities - список с query params
router.get('/', getPriorities);

// GET /priorities/:id
router.get('/:id', getPriorityById);

// POST /priorities
router.post('/', protect, createPriorities);

// PUT /priorities/:id
router.put('/:id', protect, updatePriorities);

// DELETE /priorities/:id
router.delete('/:id', protect, deletePriorities);

module.exports = router;
