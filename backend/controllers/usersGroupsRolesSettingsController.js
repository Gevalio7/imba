const UsersGroupsRolesSettings = require('../models/usersGroupsRolesSettings');
const { asyncHandler } = require('../middleware/errorHandler');

const getUsersGroupsRolesSettings = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await UsersGroupsRolesSettings.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getUsersGroupsRolesSettingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const usersgroupsrolessettingId = parseInt(id, 10);

  if (isNaN(usersgroupsrolessettingId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const usersgroupsrolessetting = await UsersGroupsRolesSettings.getById(usersgroupsrolessettingId);

  if (!usersgroupsrolessetting) {
    return res.status(404).json({ message: 'UsersGroupsRolesSetting not found' });
  }

  res.json(usersgroupsrolessetting);
});

const createUsersGroupsRolesSettings = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.description = req.body.description;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newUsersGroupsRolesSetting = await UsersGroupsRolesSettings.create(data);

  res.status(201).json(newUsersGroupsRolesSetting);
});

const updateUsersGroupsRolesSettings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const usersgroupsrolessettingId = parseInt(id, 10);

  if (isNaN(usersgroupsrolessettingId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.description !== undefined) data.description = req.body.description;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedUsersGroupsRolesSetting = await UsersGroupsRolesSettings.update(usersgroupsrolessettingId, data);

  if (!updatedUsersGroupsRolesSetting) {
    return res.status(404).json({ message: 'UsersGroupsRolesSetting not found' });
  }

  res.json(updatedUsersGroupsRolesSetting);
});

const deleteUsersGroupsRolesSettings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const usersgroupsrolessettingId = parseInt(id, 10);

  if (isNaN(usersgroupsrolessettingId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await UsersGroupsRolesSettings.delete(usersgroupsrolessettingId);

  if (!deleted) {
    return res.status(404).json({ message: 'UsersGroupsRolesSetting not found' });
  }

  res.status(204).send();
});

module.exports = {
  getUsersGroupsRolesSettings,
  getUsersGroupsRolesSettingById,
  createUsersGroupsRolesSettings,
  updateUsersGroupsRolesSettings,
  deleteUsersGroupsRolesSettings,
};
