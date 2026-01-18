const CustomerUsersServices = require('../models/customerUsersServices');
const { asyncHandler } = require('../middleware/errorHandler');

const getCustomerUsersServices = asyncHandler(async (req, res) => {
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
});

const getCustomerUsersServiceById = asyncHandler(async (req, res) => {
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
});

const createCustomerUsersServices = asyncHandler(async (req, res) => {
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

  const newCustomerUsersService = await CustomerUsersServices.create(data);

  res.status(201).json(newCustomerUsersService);
});

const updateCustomerUsersServices = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customerusersserviceId = parseInt(id, 10);

  if (isNaN(customerusersserviceId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedCustomerUsersService = await CustomerUsersServices.update(customerusersserviceId, data);

  if (!updatedCustomerUsersService) {
    return res.status(404).json({ message: 'CustomerUsersService not found' });
  }

  res.json(updatedCustomerUsersService);
});

const deleteCustomerUsersServices = asyncHandler(async (req, res) => {
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
});

module.exports = {
  getCustomerUsersServices,
  getCustomerUsersServiceById,
  createCustomerUsersServices,
  updateCustomerUsersServices,
  deleteCustomerUsersServices,
};
