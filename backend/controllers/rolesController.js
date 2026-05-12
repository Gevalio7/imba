const Roles = require('../models/roles');
const { asyncHandler } = require('../middleware/errorHandler');
const { getAgentPermissions: getAgentPermissionsMiddleware } = require('../middleware/permissions');
const { pool } = require('../config/db');

const getRoles = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 1000;
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

// Получить все доступные разрешения (синхронизированные с БД)
const getAvailablePermissions = asyncHandler(async (req, res) => {
  try {
    const permissions = await Roles.syncPermissionsWithDatabase();
    res.json({ permissions });
  } catch (error) {
    console.error('Error in getAvailablePermissions:', error);
    // Fallback к статичным разрешениям модели
    const permissions = Roles.getAvailablePermissions();
    res.json({ permissions });
  }
});

// Получить разрешения с уровнями доступа (Linux-подобная модель)
const getAvailablePermissionsWithLevels = asyncHandler(async (req, res) => {
  try {
    const permissions = await Roles.syncPermissionsWithDatabase();
    const levelDescriptions = Roles.getLevelDescriptions();
    res.json({ permissions, levelDescriptions });
  } catch (error) {
    console.error('Error in getAvailablePermissionsWithLevels:', error);
    const permissions = Roles.getAvailablePermissions();
    const levelDescriptions = Roles.getLevelDescriptions();
    res.json({ permissions, levelDescriptions });
  }
});

// Установить уровень доступа для конкретного разрешения роли
const setRolePermissionLevel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const roleId = parseInt(id, 10);

  if (isNaN(roleId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const role = await Roles.getById(roleId);
  if (!role) {
    return res.status(404).json({ message: 'Role not found' });
  }

  const { permission, level } = req.body;
  if (!permission || typeof permission !== 'string') {
    return res.status(400).json({ message: 'permission is required' });
  }
  const numericLevel = parseInt(level, 10);
  if (isNaN(numericLevel) || numericLevel < 0 || numericLevel > 777) {
    return res.status(400).json({ message: 'level must be a number 0..777' });
  }

  await Roles.setPermissionLevel(roleId, permission, numericLevel);

  const permissions = await Roles.getAllPermissionsWithDetails(roleId);
  res.json({ permissions });
});

// Получить разрешения роли
const getRolePermissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const roleId = parseInt(id, 10);

  if (isNaN(roleId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  // Проверяем существование роли
  const role = await Roles.getById(roleId);
  if (!role) {
    return res.status(404).json({ message: 'Role not found' });
  }

  // Получаем все разрешения с деталями
  const permissions = await Roles.getAllPermissionsWithDetails(roleId);
  
  res.json({ permissions });
});

// Установить разрешения роли
const setRolePermissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const roleId = parseInt(id, 10);

  if (isNaN(roleId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  // Проверяем существование роли
  const role = await Roles.getById(roleId);
  if (!role) {
    return res.status(404).json({ message: 'Role not found' });
  }

  const { permissions } = req.body;
  
  if (!permissions || typeof permissions !== 'object') {
    return res.status(400).json({ message: 'permissions object is required' });
  }

  await Roles.setPermissions(roleId, permissions);

  // Получаем обновленные разрешения
  const updatedPermissions = await Roles.getAllPermissionsWithDetails(roleId);

  res.json({ permissions: updatedPermissions });
});

// Получить разрешения агента
const getAgentPermissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentId = parseInt(id, 10);

  if (isNaN(agentId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const permissions = await getAgentPermissionsMiddleware(agentId);
  
  res.json({ permissions });
});

module.exports = {
  getRoles,
  getRoleById,
  createRoles,
  updateRoles,
  deleteRoles,
  getAvailablePermissions,
  getAvailablePermissionsWithLevels,
  getRolePermissions,
  setRolePermissions,
  setRolePermissionLevel,
  getAgentPermissions,
};
