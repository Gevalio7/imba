const CustomersGroups = require('../models/customersGroups');
const { asyncHandler } = require('../middleware/errorHandler');

const getCustomersGroups = asyncHandler(async (req, res) => {
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
});

const getCustomersGroupById = asyncHandler(async (req, res) => {
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
});

const createCustomersGroups = asyncHandler(async (req, res) => {
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

  const newCustomersGroup = await CustomersGroups.create(data);

  res.status(201).json(newCustomersGroup);
});

const updateCustomersGroups = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customersgroupId = parseInt(id, 10);

  if (isNaN(customersgroupId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedCustomersGroup = await CustomersGroups.update(customersgroupId, data);

  if (!updatedCustomersGroup) {
    return res.status(404).json({ message: 'CustomersGroup not found' });
  }

  res.json(updatedCustomersGroup);
});

const deleteCustomersGroups = asyncHandler(async (req, res) => {
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
});

module.exports = {
  getCustomersGroups,
  getCustomersGroupById,
  createCustomersGroups,
  updateCustomersGroups,
  deleteCustomersGroups,
};
