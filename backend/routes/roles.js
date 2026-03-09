const express = require('express');
const router = express.Router();
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
router.put('/:id/permissions', setRolePermissions);

// GET /agents/:id/permissions - разрешения агента
router.get('/agent/:id/permissions', getAgentPermissions);

// POST /roles
router.post('/', createRoles);

// PUT /roles/:id
router.put('/:id', updateRoles);

// DELETE /roles/:id
router.delete('/:id', deleteRoles);

module.exports = router;
