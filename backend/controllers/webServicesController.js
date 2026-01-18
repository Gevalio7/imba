const WebServices = require('../models/webServices');
const { asyncHandler } = require('../middleware/errorHandler');

const getWebServices = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await WebServices.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getWebServiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const webserviceId = parseInt(id, 10);

  if (isNaN(webserviceId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const webservice = await WebServices.getById(webserviceId);

  if (!webservice) {
    return res.status(404).json({ message: 'WebService not found' });
  }

  res.json(webservice);
});

const createWebServices = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.description = req.body.description;
  data.endpoint = req.body.endpoint;
  data.method = req.body.method;
  data.lastTested = req.body.lastTested;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newWebService = await WebServices.create(data);

  res.status(201).json(newWebService);
});

const updateWebServices = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const webserviceId = parseInt(id, 10);

  if (isNaN(webserviceId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.description !== undefined) data.description = req.body.description;
  if (req.body.endpoint !== undefined) data.endpoint = req.body.endpoint;
  if (req.body.method !== undefined) data.method = req.body.method;
  if (req.body.lastTested !== undefined) data.lastTested = req.body.lastTested;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedWebService = await WebServices.update(webserviceId, data);

  if (!updatedWebService) {
    return res.status(404).json({ message: 'WebService not found' });
  }

  res.json(updatedWebService);
});

const deleteWebServices = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const webserviceId = parseInt(id, 10);

  if (isNaN(webserviceId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await WebServices.delete(webserviceId);

  if (!deleted) {
    return res.status(404).json({ message: 'WebService not found' });
  }

  res.status(204).send();
});

module.exports = {
  getWebServices,
  getWebServiceById,
  createWebServices,
  updateWebServices,
  deleteWebServices,
};
