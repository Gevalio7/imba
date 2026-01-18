const Oauth2 = require('../models/oauth2');
const { asyncHandler } = require('../middleware/errorHandler');

const getOauth2 = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Oauth2.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getOauth2ById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const oauth2Id = parseInt(id, 10);

  if (isNaN(oauth2Id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const oauth2 = await Oauth2.getById(oauth2Id);

  if (!oauth2) {
    return res.status(404).json({ message: 'Oauth2 not found' });
  }

  res.json(oauth2);
});

const createOauth2 = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.clientId = req.body.clientId;
  data.clientSecret = req.body.clientSecret;
  data.authorizationUrl = req.body.authorizationUrl;
  data.tokenUrl = req.body.tokenUrl;
  data.scopes = req.body.scopes;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newOauth2 = await Oauth2.create(data);

  res.status(201).json(newOauth2);
});

const updateOauth2 = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const oauth2Id = parseInt(id, 10);

  if (isNaN(oauth2Id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.clientId !== undefined) data.clientId = req.body.clientId;
  if (req.body.clientSecret !== undefined) data.clientSecret = req.body.clientSecret;
  if (req.body.authorizationUrl !== undefined) data.authorizationUrl = req.body.authorizationUrl;
  if (req.body.tokenUrl !== undefined) data.tokenUrl = req.body.tokenUrl;
  if (req.body.scopes !== undefined) data.scopes = req.body.scopes;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedOauth2 = await Oauth2.update(oauth2Id, data);

  if (!updatedOauth2) {
    return res.status(404).json({ message: 'Oauth2 not found' });
  }

  res.json(updatedOauth2);
});

const deleteOauth2 = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const oauth2Id = parseInt(id, 10);

  if (isNaN(oauth2Id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await Oauth2.delete(oauth2Id);

  if (!deleted) {
    return res.status(404).json({ message: 'Oauth2 not found' });
  }

  res.status(204).send();
});

module.exports = {
  getOauth2,
  getOauth2ById,
  createOauth2,
  updateOauth2,
  deleteOauth2,
};
