const Calendars = require('../models/calendars');

const getCalendars = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getCalendars:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getCalendarById = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getCalendarById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createCalendars = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newCalendar = await Calendars.create({ name, description, status, isActive });

    res.status(201).json(newCalendar);
  } catch (error) {
    console.error('Error in createCalendars:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateCalendars = async (req, res) => {
  try {
    const { id } = req.params;
    const calendarId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(calendarId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedCalendar = await Calendars.update(calendarId, { name, description, status, isActive });

    if (!updatedCalendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    res.json(updatedCalendar);
  } catch (error) {
    console.error('Error in updateCalendars:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteCalendars = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in deleteCalendars:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getCalendars,
  getCalendarById,
  createCalendars,
  updateCalendars,
  deleteCalendars,
};
