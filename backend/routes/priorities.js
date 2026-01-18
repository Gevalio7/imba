const express = require('express');
const router = express.Router();
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
router.post('/', createPriorities);

// PUT /priorities/:id
router.put('/:id', updatePriorities);

// DELETE /priorities/:id
router.delete('/:id', deletePriorities);

module.exports = router;
