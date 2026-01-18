const CustomersGroups = require('../models/customersGroups');

const getCustomersGroups = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await CustomersGroups.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getCustomersGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getCustomersGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const customersgroupId = parseInt(id, 10);

    if (isNaN(customersgroupId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const customersgroup = await CustomersGroups.getById(customersgroupId);

    if (!customersgroup) {
      return res.status(404).json({ message: 'CustomersGroup not found' });
    }

    res.json(customersgroup);
  } catch (error) {
    console.error('Error in getCustomersGroupById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createCustomersGroups = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newCustomersGroup = await CustomersGroups.create(data);

    res.status(201).json(newCustomersGroup);
  } catch (error) {
    console.error('Error in createCustomersGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateCustomersGroups = async (req, res) => {
  try {
    const { id } = req.params;
    const customersgroupId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(customersgroupId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedCustomersGroup = await CustomersGroups.update(customersgroupId, data);

    if (!updatedCustomersGroup) {
      return res.status(404).json({ message: 'CustomersGroup not found' });
    }

    res.json(updatedCustomersGroup);
  } catch (error) {
    console.error('Error in updateCustomersGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteCustomersGroups = async (req, res) => {
  try {
    const { id } = req.params;
    const customersgroupId = parseInt(id, 10);

    if (isNaN(customersgroupId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await CustomersGroups.delete(customersgroupId);

    if (!deleted) {
      return res.status(404).json({ message: 'CustomersGroup not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteCustomersGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getCustomersGroups,
  getCustomersGroupById,
  createCustomersGroups,
  updateCustomersGroups,
  deleteCustomersGroups,
};
