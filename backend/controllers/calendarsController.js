const Calendars = require('../models/calendars');
const CalendarEvents = require('../models/calendarEvents');
const { asyncHandler } = require('../middleware/errorHandler');

const getCalendars = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Calendars.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getCalendarById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const calendarId = parseInt(id, 10);

  if (isNaN(calendarId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const calendar = await Calendars.getById(calendarId);

  if (!calendar) {
    return res.status(404).json({ message: 'Calendar not found' });
  }

  res.json(calendar);
});

const createCalendars = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.description = req.body.description;
  data.timezone = req.body.timezone;
  data.workHoursFrom = req.body.workHoursFrom;
  data.workHoursTo = req.body.workHoursTo;
  data.workDaysPerWeek = req.body.workDaysPerWeek;
  data.color = req.body.color;
  data.dateFrom = req.body.dateFrom;
  data.dateTo = req.body.dateTo;

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newCalendar = await Calendars.create(data);

  res.status(201).json(newCalendar);
});

const updateCalendars = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const calendarId = parseInt(id, 10);

  if (isNaN(calendarId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.description !== undefined) data.description = req.body.description;
  if (req.body.timezone !== undefined) data.timezone = req.body.timezone;
  if (req.body.workHoursFrom !== undefined) data.workHoursFrom = req.body.workHoursFrom;
  if (req.body.workHoursTo !== undefined) data.workHoursTo = req.body.workHoursTo;
  if (req.body.workDaysPerWeek !== undefined) data.workDaysPerWeek = req.body.workDaysPerWeek;
  if (req.body.color !== undefined) data.color = req.body.color;
  if (req.body.dateFrom !== undefined) data.dateFrom = req.body.dateFrom;
  if (req.body.dateTo !== undefined) data.dateTo = req.body.dateTo;

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedCalendar = await Calendars.update(calendarId, data);

  if (!updatedCalendar) {
    return res.status(404).json({ message: 'Calendar not found' });
  }

  res.json(updatedCalendar);
});

const deleteCalendars = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const calendarId = parseInt(id, 10);

  if (isNaN(calendarId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await Calendars.delete(calendarId);

  if (!deleted) {
    return res.status(404).json({ message: 'Calendar not found' });
  }

  res.status(204).send();
});

module.exports = {
  getCalendars,
  getCalendarById,
  createCalendars,
  updateCalendars,
  deleteCalendars,
};
