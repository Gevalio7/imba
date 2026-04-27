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
  getRolePermissions,
  setRolePermissions,
  getAgentPermissions,
} = require('../controllers/rolesController');

// GET /roles - список с query params
router.get('/', getRoles);

// GET /roles/permissions - все доступные разрешения
router.get('/permissions', getAvailablePermissions);

// GET /roles/:id
router.get('/:id', getRoleById);

// GET /roles/:id/permissions - разрешения роли
router.get('/:id/permissions', getRolePermissions);

// PUT /roles/:id/permissions - установить разрешения роли
router.put('/:id/permissions', protect, checkPermission('manage_users'), setRolePermissions);

// GET /agents/:id/permissions - разрешения агента
router.get('/agent/:id/permissions', getAgentPermissions);

// POST /roles
router.post('/', protect, checkPermission('manage_users'), createRoles);

// PUT /roles/:id
router.put('/:id', protect, checkPermission('manage_users'), updateRoles);

// DELETE /roles/:id
router.delete('/:id', protect, checkPermission('manage_users'), deleteRoles);

module.exports = router;
