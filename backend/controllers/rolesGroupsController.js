const RolesGroups = require('../models/rolesGroups');
const { asyncHandler } = require('../middleware/errorHandler');

const getRolesGroups = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await RolesGroups.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getRolesGroupById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rolesgroupId = parseInt(id, 10);

  if (isNaN(rolesgroupId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const rolesgroup = await RolesGroups.getById(rolesgroupId);

  if (!rolesgroup) {
    return res.status(404).json({ message: 'RolesGroup not found' });
  }

  res.json(rolesgroup);
});

const createRolesGroups = asyncHandler(async (req, res) => {
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

  const newRolesGroup = await RolesGroups.create(data);

  res.status(201).json(newRolesGroup);
});

const updateRolesGroups = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rolesgroupId = parseInt(id, 10);

  if (isNaN(rolesgroupId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedRolesGroup = await RolesGroups.update(rolesgroupId, data);

  if (!updatedRolesGroup) {
    return res.status(404).json({ message: 'RolesGroup not found' });
  }

  res.json(updatedRolesGroup);
});

const deleteRolesGroups = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rolesgroupId = parseInt(id, 10);

  if (isNaN(rolesgroupId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await RolesGroups.delete(rolesgroupId);

  if (!deleted) {
    return res.status(404).json({ message: 'RolesGroup not found' });
  }

  res.status(204).send();
});

module.exports = {
  getRolesGroups,
  getRolesGroupById,
  createRolesGroups,
  updateRolesGroups,
  deleteRolesGroups,
};
