const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const {
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
} = require('../controllers/rolesController');

// GET /roles - список с query params
router.get('/', getRoles);

// GET /roles/permissions - все доступные разрешения (синхронизированные с БД)
router.get('/permissions', getAvailablePermissions);

// GET /roles/permissions-with-levels - разрешения с числовыми уровнями (Linux-модель)
router.get('/permissions-with-levels', getAvailablePermissionsWithLevels);

// GET /roles/:id
router.get('/:id', getRoleById);

// GET /roles/:id/permissions - разрешения роли (с уровнями)
router.get('/:id/permissions', getRolePermissions);

// PUT /roles/:id/permissions - установить разрешения роли (требуется menu_roles_list_write)
router.put('/:id/permissions', protect, checkPermission('menu_roles_list_write'), setRolePermissions);

// PUT /roles/:id/permissions-level - числовой уровень для разрешения (требуется menu_roles_list_write)
router.put('/:id/permissions-level', protect, checkPermission('menu_roles_list_write'), setRolePermissionLevel);

// GET /agents/:id/permissions - разрешения агента
router.get('/agent/:id/permissions', getAgentPermissions);

// POST /roles
router.post('/', protect, createRoles);

// PUT /roles/:id
router.put('/:id', protect, updateRoles);

// DELETE /roles/:id
router.delete('/:id', protect, deleteRoles);

module.exports = router;
