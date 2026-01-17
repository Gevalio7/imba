const CustomerUsersServices = require('../models/customerUsersServices');

const getCustomerUsersServices = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await CustomerUsersServices.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getCustomerUsersServices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getCustomerUsersServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const customerusersserviceId = parseInt(id, 10);

    if (isNaN(customerusersserviceId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const customerusersservice = await CustomerUsersServices.getById(customerusersserviceId);

    if (!customerusersservice) {
      return res.status(404).json({ message: 'CustomerUsersService not found' });
    }

    res.json(customerusersservice);
  } catch (error) {
    console.error('Error in getCustomerUsersServiceById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createCustomerUsersServices = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newCustomerUsersService = await CustomerUsersServices.create({ name, description, status, isActive });

    res.status(201).json(newCustomerUsersService);
  } catch (error) {
    console.error('Error in createCustomerUsersServices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateCustomerUsersServices = async (req, res) => {
  try {
    const { id } = req.params;
    const customerusersserviceId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(customerusersserviceId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedCustomerUsersService = await CustomerUsersServices.update(customerusersserviceId, { name, description, status, isActive });

    if (!updatedCustomerUsersService) {
      return res.status(404).json({ message: 'CustomerUsersService not found' });
    }

    res.json(updatedCustomerUsersService);
  } catch (error) {
    console.error('Error in updateCustomerUsersServices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteCustomerUsersServices = async (req, res) => {
  try {
    const { id } = req.params;
    const customerusersserviceId = parseInt(id, 10);

    if (isNaN(customerusersserviceId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await CustomerUsersServices.delete(customerusersserviceId);

    if (!deleted) {
      return res.status(404).json({ message: 'CustomerUsersService not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteCustomerUsersServices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getCustomerUsersServices,
  getCustomerUsersServiceById,
  createCustomerUsersServices,
  updateCustomerUsersServices,
  deleteCustomerUsersServices,
};
