const CustomerUsers = require('../models/customerUsers');

const getCustomerUsers = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await CustomerUsers.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getCustomerUsers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getCustomerUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const customeruserId = parseInt(id, 10);

    if (isNaN(customeruserId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const customeruser = await CustomerUsers.getById(customeruserId);

    if (!customeruser) {
      return res.status(404).json({ message: 'CustomerUser not found' });
    }

    res.json(customeruser);
  } catch (error) {
    console.error('Error in getCustomerUserById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createCustomerUsers = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newCustomerUser = await CustomerUsers.create(data);

    res.status(201).json(newCustomerUser);
  } catch (error) {
    console.error('Error in createCustomerUsers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateCustomerUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const customeruserId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(customeruserId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedCustomerUser = await CustomerUsers.update(customeruserId, data);

    if (!updatedCustomerUser) {
      return res.status(404).json({ message: 'CustomerUser not found' });
    }

    res.json(updatedCustomerUser);
  } catch (error) {
    console.error('Error in updateCustomerUsers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteCustomerUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const customeruserId = parseInt(id, 10);

    if (isNaN(customeruserId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await CustomerUsers.delete(customeruserId);

    if (!deleted) {
      return res.status(404).json({ message: 'CustomerUser not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteCustomerUsers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getCustomerUsers,
  getCustomerUserById,
  createCustomerUsers,
  updateCustomerUsers,
  deleteCustomerUsers,
};
