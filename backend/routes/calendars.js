const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCalendars,
  getCalendarById,
  createCalendars,
  updateCalendars,
  deleteCalendars,
} = require('../controllers/calendarsController');

// GET /calendars - список с query params
router.get('/', getCalendars);

// GET /calendars/:id
router.get('/:id', getCalendarById);

// POST /calendars
router.post('/', protect, createCalendars);

// PUT /calendars/:id
router.put('/', protect, updateCalendars);

// DELETE /calendars/:id
router.delete('/:id', protect, deleteCalendars);

module.exports = router;
