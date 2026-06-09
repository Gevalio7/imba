const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')
const controller = require('../controllers/ticketCommentsController')

// GET /ticket-comments - список с query params
router.get('/', controller.getAll)

// GET /ticket-comments/:id
router.get('/:id', controller.getById)

// POST /ticket-comments
router.post('/', protect, controller.create)

// PUT /ticket-comments/:id
router.put('/:id', protect, controller.update)

// DELETE /ticket-comments/:id
router.delete('/:id', protect, controller.remove)

module.exports = router
