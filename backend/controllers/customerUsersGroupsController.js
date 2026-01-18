const CustomerUsersGroups = require('../models/customerUsersGroups');

const getCustomerUsersGroups = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await CustomerUsersGroups.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getCustomerUsersGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getCustomerUsersGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const customerusersgroupId = parseInt(id, 10);

    if (isNaN(customerusersgroupId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const customerusersgroup = await CustomerUsersGroups.getById(customerusersgroupId);

    if (!customerusersgroup) {
      return res.status(404).json({ message: 'CustomerUsersGroup not found' });
    }

    res.json(customerusersgroup);
  } catch (error) {
    console.error('Error in getCustomerUsersGroupById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createCustomerUsersGroups = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newCustomerUsersGroup = await CustomerUsersGroups.create(data);

    res.status(201).json(newCustomerUsersGroup);
  } catch (error) {
    console.error('Error in createCustomerUsersGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateCustomerUsersGroups = async (req, res) => {
  try {
    const { id } = req.params;
    const customerusersgroupId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(customerusersgroupId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedCustomerUsersGroup = await CustomerUsersGroups.update(customerusersgroupId, data);

    if (!updatedCustomerUsersGroup) {
      return res.status(404).json({ message: 'CustomerUsersGroup not found' });
    }

    res.json(updatedCustomerUsersGroup);
  } catch (error) {
    console.error('Error in updateCustomerUsersGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteCustomerUsersGroups = async (req, res) => {
  try {
    const { id } = req.params;
    const customerusersgroupId = parseInt(id, 10);

    if (isNaN(customerusersgroupId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await CustomerUsersGroups.delete(customerusersgroupId);

    if (!deleted) {
      return res.status(404).json({ message: 'CustomerUsersGroup not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteCustomerUsersGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getCustomerUsersGroups,
  getCustomerUsersGroupById,
  createCustomerUsersGroups,
  updateCustomerUsersGroups,
  deleteCustomerUsersGroups,
};
