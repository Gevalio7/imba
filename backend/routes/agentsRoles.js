const express = require('express');
const router = express.Router();
const {
  getAgentsRoles,
  getAgentsRoleById,
  createAgentsRoles,
  updateAgentsRoles,
  deleteAgentsRoles,
} = require('../controllers/agentsRolesController');

// GET /agentsRoles - список с query params
router.get('/', getAgentsRoles);

// GET /agentsRoles/:id
router.get('/:id', getAgentsRoleById);

// POST /agentsRoles
router.post('/', createAgentsRoles);

// PUT /agentsRoles/:id
router.put('/:id', updateAgentsRoles);

// DELETE /agentsRoles/:id
router.delete('/:id', deleteAgentsRoles);

module.exports = router;
