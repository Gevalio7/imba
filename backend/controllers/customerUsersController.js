const CustomerUsers = require('../models/customerUsers');
const { asyncHandler } = require('../middleware/errorHandler');

const getCustomerUsers = asyncHandler(async (req, res) => {
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
});

const getCustomerUserById = asyncHandler(async (req, res) => {
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
});

const createCustomerUsers = asyncHandler(async (req, res) => {
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

  const newCustomerUser = await CustomerUsers.create(data);

  res.status(201).json(newCustomerUser);
});

const updateCustomerUsers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customeruserId = parseInt(id, 10);

  if (isNaN(customeruserId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedCustomerUser = await CustomerUsers.update(customeruserId, data);

  if (!updatedCustomerUser) {
    return res.status(404).json({ message: 'CustomerUser not found' });
  }

  res.json(updatedCustomerUser);
});

const deleteCustomerUsers = asyncHandler(async (req, res) => {
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
});

module.exports = {
  getCustomerUsers,
  getCustomerUserById,
  createCustomerUsers,
  updateCustomerUsers,
  deleteCustomerUsers,
};
