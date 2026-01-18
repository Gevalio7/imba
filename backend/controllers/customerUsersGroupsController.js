const CustomerUsersGroups = require('../models/customerUsersGroups');
const { asyncHandler } = require('../middleware/errorHandler');

const getCustomerUsersGroups = asyncHandler(async (req, res) => {
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
});

const getCustomerUsersGroupById = asyncHandler(async (req, res) => {
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
});

const createCustomerUsersGroups = asyncHandler(async (req, res) => {
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

  const newCustomerUsersGroup = await CustomerUsersGroups.create(data);

  res.status(201).json(newCustomerUsersGroup);
});

const updateCustomerUsersGroups = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customerusersgroupId = parseInt(id, 10);

  if (isNaN(customerusersgroupId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedCustomerUsersGroup = await CustomerUsersGroups.update(customerusersgroupId, data);

  if (!updatedCustomerUsersGroup) {
    return res.status(404).json({ message: 'CustomerUsersGroup not found' });
  }

  res.json(updatedCustomerUsersGroup);
});

const deleteCustomerUsersGroups = asyncHandler(async (req, res) => {
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
});

module.exports = {
  getCustomerUsersGroups,
  getCustomerUsersGroupById,
  createCustomerUsersGroups,
  updateCustomerUsersGroups,
  deleteCustomerUsersGroups,
};
