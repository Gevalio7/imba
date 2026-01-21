const CalendarEvents = require('../models/calendarEvents');
const { asyncHandler } = require('../middleware/errorHandler');

const getCalendarEvents = asyncHandler(async (req, res) => {
  const { calendarId, q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;
  let calendarIdLocal;
  if (Array.isArray(calendarId)) {
    calendarIdLocal = calendarId.map(id => parseInt(id, 10));
  } else if (typeof calendarId === 'string') {
    calendarIdLocal = parseInt(calendarId, 10);
  }

  const result = await CalendarEvents.getAll({
    calendarId: calendarIdLocal,
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getCalendarEventById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const eventId = parseInt(id, 10);

  if (isNaN(eventId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const event = await CalendarEvents.getById(eventId);

  if (!event) {
    return res.status(404).json({ message: 'Calendar event not found' });
  }

  res.json(event);
});

const createCalendarEvent = asyncHandler(async (req, res) => {
  const data = {};
  data.calendarId = req.body.calendarId;
  data.title = req.body.title;
  data.start = req.body.start;
  data.eventEnd = req.body.eventEnd;
  data.allDay = req.body.allDay;
  data.description = req.body.description;

  // Валидация обязательных полей
  if (!data.calendarId || !data.title || !data.start || !data.eventEnd) {
    return res.status(400).json({ message: 'calendarId, title, start, eventEnd are required' });
  }

  const newEvent = await CalendarEvents.create(data);

  res.status(201).json(newEvent);
});

const updateCalendarEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const eventId = parseInt(id, 10);

  if (isNaN(eventId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.calendarId !== undefined) data.calendarId = req.body.calendarId;
  if (req.body.title !== undefined) data.title = req.body.title;
  if (req.body.start !== undefined) data.start = req.body.start;
  if (req.body.eventEnd !== undefined) data.eventEnd = req.body.eventEnd;
  if (req.body.allDay !== undefined) data.allDay = req.body.allDay;
  if (req.body.description !== undefined) data.description = req.body.description;

  const updatedEvent = await CalendarEvents.update(eventId, data);

  if (!updatedEvent) {
    return res.status(404).json({ message: 'Calendar event not found' });
  }

  res.json(updatedEvent);
});

const deleteCalendarEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const eventId = parseInt(id, 10);

  if (isNaN(eventId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await CalendarEvents.delete(eventId);

  if (!deleted) {
    return res.status(404).json({ message: 'Calendar event not found' });
  }

  res.status(204).send();
});

module.exports = {
  getCalendarEvents,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
};
