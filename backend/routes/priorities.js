const express = require('express');
const router = express.Router();
const {
  getPriorities,
  getPriorityById,
  createPriority,
  updatePriority,
  deletePriority,
} = require('../controllers/prioritiesController');

// GET /priorities - список с query params
router.get('/', getPriorities);

// GET /priorities/:id
router.get('/:id', getPriorityById);

// POST /priorities
router.post('/', createPriority);

// PUT /priorities/:id
router.put('/:id', updatePriority);

// DELETE /priorities/:id
router.delete('/:id', deletePriority);

module.exports = router;
