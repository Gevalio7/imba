const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')

const {
  getAutoResponses,
  getAutoResponseById,
  createAutoResponses,
  updateAutoResponses,
  deleteAutoResponses,
} = require('../controllers/autoResponsesController')

// GET /autoResponses - список с query params
router.get('/', getAutoResponses)

// GET /autoResponses/:id
router.get('/:id', getAutoResponseById)

// POST /autoResponses
router.post('/', protect, createAutoResponses)

// PUT /autoResponses/:id
router.put('/:id', protect, updateAutoResponses)

// DELETE /autoResponses/:id
router.delete('/:id', protect, deleteAutoResponses)

module.exports = router
