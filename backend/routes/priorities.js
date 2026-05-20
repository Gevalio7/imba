const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')
const { checkPermission } = require('../middleware/permissions')

const {
  getPriorities,
  getPriorityById,
  createPriorities,
  updatePriorities,
  deletePriorities,
} = require('../controllers/prioritiesController')

// GET /priorities - список с query params
router.get('/', getPriorities)

// GET /priorities/:id
router.get('/:id', getPriorityById)

// POST /priorities
router.post('/', protect, checkPermission('menu_priorities_write'), createPriorities)

// PUT /priorities/:id
router.put('/:id', protect, checkPermission('menu_priorities_write'), updatePriorities)

// DELETE /priorities/:id
router.delete('/:id', protect, checkPermission('menu_priorities_delete'), deletePriorities)

module.exports = router
