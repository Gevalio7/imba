const Customers = require('../models/customers');
const { asyncHandler } = require('../middleware/errorHandler');

const getCustomers = asyncHandler(async (req, res) => {
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
});

const getCustomerById = asyncHandler(async (req, res) => {
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
});

const createCustomers = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.street = req.body.street;
  data.zip = req.body.zip;
  data.city = req.body.city;
  data.comment = req.body.comment;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newCustomer = await Customers.create(data);

  res.status(201).json(newCustomer);
});

const updateCustomers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customerId = parseInt(id, 10);

  if (isNaN(customerId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.street !== undefined) data.street = req.body.street;
  if (req.body.zip !== undefined) data.zip = req.body.zip;
  if (req.body.city !== undefined) data.city = req.body.city;
  if (req.body.comment !== undefined) data.comment = req.body.comment;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedCustomer = await Customers.update(customerId, data);

  if (!updatedCustomer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  res.json(updatedCustomer);
});

const deleteCustomers = asyncHandler(async (req, res) => {
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
});

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomers,
  updateCustomers,
  deleteCustomers,
};
