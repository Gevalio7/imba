const CustomerUsersCustomers = require('../models/customerUsersCustomers');
const { asyncHandler } = require('../middleware/errorHandler');

const getCustomerUsersCustomers = asyncHandler(async (req, res) => {
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
});

const getCustomerUsersCustomerById = asyncHandler(async (req, res) => {
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
});

const createCustomerUsersCustomers = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newCustomerUsersCustomer = await CustomerUsersCustomers.create(data);

  res.status(201).json(newCustomerUsersCustomer);
});

const updateCustomerUsersCustomers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customeruserscustomerId = parseInt(id, 10);

  if (isNaN(customeruserscustomerId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedCustomerUsersCustomer = await CustomerUsersCustomers.update(customeruserscustomerId, data);

  if (!updatedCustomerUsersCustomer) {
    return res.status(404).json({ message: 'CustomerUsersCustomer not found' });
  }

  res.json(updatedCustomerUsersCustomer);
});

const deleteCustomerUsersCustomers = asyncHandler(async (req, res) => {
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
});

module.exports = {
  getCustomerUsersCustomers,
  getCustomerUsersCustomerById,
  createCustomerUsersCustomers,
  updateCustomerUsersCustomers,
  deleteCustomerUsersCustomers,
};
