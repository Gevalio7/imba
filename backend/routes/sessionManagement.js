const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')

const {
  getSessionManagement,
  getSessionManagementById,
  createSessionManagement,
  terminateSession,
  terminateAllSessions,
  terminateCurrentSession,
} = require('../controllers/sessionManagementController')

// GET /sessionManagement - список с query params
router.get('/', protect, getSessionManagement)

// GET /sessionManagement/:id
router.get('/:id', protect, getSessionManagementById)

// POST /sessionManagement
router.post('/', protect, createSessionManagement)

// PUT /sessionManagement/:id/terminate
router.put('/:id/terminate', protect, terminateSession)

// POST /sessionManagement/terminate-all
router.post('/terminate-all', protect, terminateAllSessions)

// POST /sessionManagement/terminate-current
router.post('/terminate-current', protect, terminateCurrentSession)

module.exports = router
