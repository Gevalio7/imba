const Greetings = require('../models/greetings');
const { asyncHandler } = require('../middleware/errorHandler');

const getGreetings = asyncHandler(async (req, res) => {
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
});

const getGreetingById = asyncHandler(async (req, res) => {
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
});

const createGreetings = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.content = req.body.content;
  data.comment = req.body.comment;

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newGreeting = await Greetings.create(data);

  res.status(201).json(newGreeting);
});

const updateGreetings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const greetingId = parseInt(id, 10);

  if (isNaN(greetingId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.content !== undefined) data.content = req.body.content;
  if (req.body.comment !== undefined) data.comment = req.body.comment;

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedGreeting = await Greetings.update(greetingId, data);

  if (!updatedGreeting) {
    return res.status(404).json({ message: 'Greeting not found' });
  }

  res.json(updatedGreeting);
});

const deleteGreetings = asyncHandler(async (req, res) => {
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
});

module.exports = {
  getGreetings,
  getGreetingById,
  createGreetings,
  updateGreetings,
  deleteGreetings,
};
