const express = require('express');
const router = express.Router();
const {
  getCalendarEvents,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} = require('../controllers/calendarEventsController');

// GET /calendar-events - список с query params
router.get('/', getCalendarEvents);

// GET /calendar-events/:id
router.get('/:id', getCalendarEventById);

// POST /calendar-events
router.post('/', createCalendarEvent);

// PUT /calendar-events/:id
router.put('/:id', updateCalendarEvent);

// DELETE /calendar-events/:id
router.delete('/:id', deleteCalendarEvent);

module.exports = router;
