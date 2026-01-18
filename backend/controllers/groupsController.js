const Groups = require('../models/groups');
const { asyncHandler } = require('../middleware/errorHandler');

const getGroups = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Groups.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getGroupById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const groupId = parseInt(id, 10);

  if (isNaN(groupId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const group = await Groups.getById(groupId);

  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }

  res.json(group);
});

const createGroups = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newGroup = await Groups.create(data);

  res.status(201).json(newGroup);
});

const updateGroups = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const groupId = parseInt(id, 10);

  if (isNaN(groupId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedGroup = await Groups.update(groupId, data);

  if (!updatedGroup) {
    return res.status(404).json({ message: 'Group not found' });
  }

  res.json(updatedGroup);
});

const deleteGroups = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const groupId = parseInt(id, 10);

  if (isNaN(groupId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await Groups.delete(groupId);

  if (!deleted) {
    return res.status(404).json({ message: 'Group not found' });
  }

  res.status(204).send();
});

module.exports = {
  getGroups,
  getGroupById,
  createGroups,
  updateGroups,
  deleteGroups,
};
