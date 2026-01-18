const Roles = require('../models/roles');
const { asyncHandler } = require('../middleware/errorHandler');

const getRoles = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Roles.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getRoleById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const roleId = parseInt(id, 10);

  if (isNaN(roleId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const role = await Roles.getById(roleId);

  if (!role) {
    return res.status(404).json({ message: 'Role not found' });
  }

  res.json(role);
});

const createRoles = asyncHandler(async (req, res) => {
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

  const newRole = await Roles.create(data);

  res.status(201).json(newRole);
});

const updateRoles = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const roleId = parseInt(id, 10);

  if (isNaN(roleId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedRole = await Roles.update(roleId, data);

  if (!updatedRole) {
    return res.status(404).json({ message: 'Role not found' });
  }

  res.json(updatedRole);
});

const deleteRoles = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const roleId = parseInt(id, 10);

  if (isNaN(roleId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await Roles.delete(roleId);

  if (!deleted) {
    return res.status(404).json({ message: 'Role not found' });
  }

  res.status(204).send();
});

module.exports = {
  getRoles,
  getRoleById,
  createRoles,
  updateRoles,
  deleteRoles,
};
