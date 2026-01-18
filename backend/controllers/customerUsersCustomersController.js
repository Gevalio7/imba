const CustomerUsersCustomers = require('../models/customerUsersCustomers');

const getCustomerUsersCustomers = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await CustomerUsersCustomers.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getCustomerUsersCustomers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getCustomerUsersCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customeruserscustomerId = parseInt(id, 10);

    if (isNaN(customeruserscustomerId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const customeruserscustomer = await CustomerUsersCustomers.getById(customeruserscustomerId);

    if (!customeruserscustomer) {
      return res.status(404).json({ message: 'CustomerUsersCustomer not found' });
    }

    res.json(customeruserscustomer);
  } catch (error) {
    console.error('Error in getCustomerUsersCustomerById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createCustomerUsersCustomers = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newCustomerUsersCustomer = await CustomerUsersCustomers.create(data);

    res.status(201).json(newCustomerUsersCustomer);
  } catch (error) {
    console.error('Error in createCustomerUsersCustomers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateCustomerUsersCustomers = async (req, res) => {
  try {
    const { id } = req.params;
    const customeruserscustomerId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(customeruserscustomerId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedCustomerUsersCustomer = await CustomerUsersCustomers.update(customeruserscustomerId, data);

    if (!updatedCustomerUsersCustomer) {
      return res.status(404).json({ message: 'CustomerUsersCustomer not found' });
    }

    res.json(updatedCustomerUsersCustomer);
  } catch (error) {
    console.error('Error in updateCustomerUsersCustomers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteCustomerUsersCustomers = async (req, res) => {
  try {
    const { id } = req.params;
    const customeruserscustomerId = parseInt(id, 10);

    if (isNaN(customeruserscustomerId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await CustomerUsersCustomers.delete(customeruserscustomerId);

    if (!deleted) {
      return res.status(404).json({ message: 'CustomerUsersCustomer not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteCustomerUsersCustomers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getCustomerUsersCustomers,
  getCustomerUsersCustomerById,
  createCustomerUsersCustomers,
  updateCustomerUsersCustomers,
  deleteCustomerUsersCustomers,
};
