const express = require('express');
const router = express.Router();
const {
  getRoles,
  getRoleById,
  createRoles,
  updateRoles,
  deleteRoles,
} = require('../controllers/rolesController');

// GET /roles - список с query params
router.get('/', getRoles);

// GET /roles/:id
router.get('/:id', getRoleById);

// POST /roles
router.post('/', createRoles);

// PUT /roles/:id
router.put('/:id', updateRoles);

// DELETE /roles/:id
router.delete('/:id', deleteRoles);

module.exports = router;
