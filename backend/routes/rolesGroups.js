const express = require('express');
const router = express.Router();
const {
  getRolesGroups,
  getRolesGroupById,
  createRolesGroups,
  updateRolesGroups,
  deleteRolesGroups,
} = require('../controllers/rolesGroupsController');

// GET /rolesGroups - список с query params
router.get('/', getRolesGroups);

// GET /rolesGroups/:id
router.get('/:id', getRolesGroupById);

// POST /rolesGroups
router.post('/', createRolesGroups);

// PUT /rolesGroups/:id
router.put('/:id', updateRolesGroups);

// DELETE /rolesGroups/:id
router.delete('/:id', deleteRolesGroups);

module.exports = router;
