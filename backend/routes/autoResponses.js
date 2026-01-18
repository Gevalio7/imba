const express = require('express');
const router = express.Router();
const {
  getAutoResponses,
  getAutoResponseById,
  createAutoResponses,
  updateAutoResponses,
  deleteAutoResponses,
} = require('../controllers/autoResponsesController');

// GET /autoResponses - список с query params
router.get('/', getAutoResponses);

// GET /autoResponses/:id
router.get('/:id', getAutoResponseById);

// POST /autoResponses
router.post('/', createAutoResponses);

// PUT /autoResponses/:id
router.put('/:id', updateAutoResponses);

// DELETE /autoResponses/:id
router.delete('/:id', deleteAutoResponses);

module.exports = router;
