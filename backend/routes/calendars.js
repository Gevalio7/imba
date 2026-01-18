const express = require('express');
const router = express.Router();
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
router.post('/', createCalendars);

// PUT /calendars/:id
router.put('/:id', updateCalendars);

// DELETE /calendars/:id
router.delete('/:id', deleteCalendars);

module.exports = router;
