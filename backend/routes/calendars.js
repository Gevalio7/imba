const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')
const { checkPermission } = require('../middleware/permissions')

const {
  getCalendars,
  getCalendarById,
  createCalendars,
  updateCalendars,
  deleteCalendars,
} = require('../controllers/calendarsController')

// GET /calendars - список с query params
router.get('/', getCalendars)

// GET /calendars/:id
router.get('/:id', getCalendarById)

// POST /calendars
router.post('/', protect, checkPermission('menu_calendars_write'), createCalendars)

// PUT /calendars/:id
router.put('/:id', protect, checkPermission('menu_calendars_write'), updateCalendars)

// DELETE /calendars/:id
router.delete('/:id', protect, checkPermission('menu_calendars_delete'), deleteCalendars)

module.exports = router
