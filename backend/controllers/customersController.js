const Customers = require('../models/customers');

const getCustomers = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await Customers.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getCustomers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = parseInt(id, 10);

    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const customer = await Customers.getById(customerId);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Error in getCustomerById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createCustomers = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.street = req.body.street;
    data.zip = req.body.zip;
    data.city = req.body.city;
    data.comment = req.body.comment;
    data.status = req.body.status;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newCustomer = await Customers.create(data);

    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error in createCustomers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateCustomers = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.street = req.body.street;
    data.zip = req.body.zip;
    data.city = req.body.city;
    data.comment = req.body.comment;
    data.status = req.body.status;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedCustomer = await Customers.update(customerId, data);

    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(updatedCustomer);
  } catch (error) {
    console.error('Error in updateCustomers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteCustomers = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = parseInt(id, 10);

    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await Customers.delete(customerId);

    if (!deleted) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteCustomers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomers,
  updateCustomers,
  deleteCustomers,
};
