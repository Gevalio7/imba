const Greetings = require('../models/greetings');

const getGreetings = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await Greetings.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getGreetings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getGreetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const greetingId = parseInt(id, 10);

    if (isNaN(greetingId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const greeting = await Greetings.getById(greetingId);

    if (!greeting) {
      return res.status(404).json({ message: 'Greeting not found' });
    }

    res.json(greeting);
  } catch (error) {
    console.error('Error in getGreetingById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createGreetings = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newGreeting = await Greetings.create({ name, description, status, isActive });

    res.status(201).json(newGreeting);
  } catch (error) {
    console.error('Error in createGreetings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateGreetings = async (req, res) => {
  try {
    const { id } = req.params;
    const greetingId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(greetingId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedGreeting = await Greetings.update(greetingId, { name, description, status, isActive });

    if (!updatedGreeting) {
      return res.status(404).json({ message: 'Greeting not found' });
    }

    res.json(updatedGreeting);
  } catch (error) {
    console.error('Error in updateGreetings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteGreetings = async (req, res) => {
  try {
    const { id } = req.params;
    const greetingId = parseInt(id, 10);

    if (isNaN(greetingId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await Greetings.delete(greetingId);

    if (!deleted) {
      return res.status(404).json({ message: 'Greeting not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteGreetings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getGreetings,
  getGreetingById,
  createGreetings,
  updateGreetings,
  deleteGreetings,
};
