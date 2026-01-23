const Services = require('../models/services');
const { asyncHandler } = require('../middleware/errorHandler');

const getServices = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Services.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getServiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const serviceId = parseInt(id, 10);

  if (isNaN(serviceId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const service = await Services.getById(serviceId);

  if (!service) {
    return res.status(404).json({ message: 'Service not found' });
  }

  res.json(service);
});

const createServices = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.comment = req.body.comment;
  data.type = req.body.type;

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newService = await Services.create(data);

  res.status(201).json(newService);
});

const updateServices = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const serviceId = parseInt(id, 10);

  if (isNaN(serviceId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.comment !== undefined) data.comment = req.body.comment;
  if (req.body.type !== undefined) data.type = req.body.type;

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedService = await Services.update(serviceId, data);

  if (!updatedService) {
    return res.status(404).json({ message: 'Service not found' });
  }

  res.json(updatedService);
});

const deleteServices = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const serviceId = parseInt(id, 10);

  if (isNaN(serviceId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await Services.delete(serviceId);

  if (!deleted) {
    return res.status(404).json({ message: 'Service not found' });
  }

  res.status(204).send();
});

module.exports = {
  getServices,
  getServiceById,
  createServices,
  updateServices,
  deleteServices,
};
