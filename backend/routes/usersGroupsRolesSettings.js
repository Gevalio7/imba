const express = require('express');
const router = express.Router();
const {
  getUsersGroupsRolesSettings,
  getUsersGroupsRolesSettingById,
  createUsersGroupsRolesSettings,
  updateUsersGroupsRolesSettings,
  deleteUsersGroupsRolesSettings,
} = require('../controllers/usersGroupsRolesSettingsController');

// GET /usersGroupsRolesSettings - список с query params
router.get('/', getUsersGroupsRolesSettings);

// GET /usersGroupsRolesSettings/:id
router.get('/:id', getUsersGroupsRolesSettingById);

// POST /usersGroupsRolesSettings
router.post('/', createUsersGroupsRolesSettings);

// PUT /usersGroupsRolesSettings/:id
router.put('/:id', updateUsersGroupsRolesSettings);

// DELETE /usersGroupsRolesSettings/:id
router.delete('/:id', deleteUsersGroupsRolesSettings);

module.exports = router;
