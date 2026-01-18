const UsersGroupsRolesSettings = require('../models/usersGroupsRolesSettings');

const getUsersGroupsRolesSettings = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getUsersGroupsRolesSettings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getUsersGroupsRolesSettingById = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getUsersGroupsRolesSettingById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createUsersGroupsRolesSettings = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newUsersGroupsRolesSetting = await UsersGroupsRolesSettings.create(data);

    res.status(201).json(newUsersGroupsRolesSetting);
  } catch (error) {
    console.error('Error in createUsersGroupsRolesSettings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateUsersGroupsRolesSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const usersgroupsrolessettingId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(usersgroupsrolessettingId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedUsersGroupsRolesSetting = await UsersGroupsRolesSettings.update(usersgroupsrolessettingId, data);

    if (!updatedUsersGroupsRolesSetting) {
      return res.status(404).json({ message: 'UsersGroupsRolesSetting not found' });
    }

    res.json(updatedUsersGroupsRolesSetting);
  } catch (error) {
    console.error('Error in updateUsersGroupsRolesSettings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteUsersGroupsRolesSettings = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in deleteUsersGroupsRolesSettings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getUsersGroupsRolesSettings,
  getUsersGroupsRolesSettingById,
  createUsersGroupsRolesSettings,
  updateUsersGroupsRolesSettings,
  deleteUsersGroupsRolesSettings,
};
