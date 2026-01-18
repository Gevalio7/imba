const Acl = require('../models/acl');
const { asyncHandler } = require('../middleware/errorHandler');

const getAcl = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Acl.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getAclById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const aclId = parseInt(id, 10);

  if (isNaN(aclId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const acl = await Acl.getById(aclId);

  if (!acl) {
    return res.status(404).json({ message: 'Acl not found' });
  }

  res.json(acl);
});

const createAcl = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.description = req.body.description;
  data.permissions = req.body.permissions;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newAcl = await Acl.create(data);

  res.status(201).json(newAcl);
});

const updateAcl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const aclId = parseInt(id, 10);

  if (isNaN(aclId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.description !== undefined) data.description = req.body.description;
  if (req.body.permissions !== undefined) data.permissions = req.body.permissions;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedAcl = await Acl.update(aclId, data);

  if (!updatedAcl) {
    return res.status(404).json({ message: 'Acl not found' });
  }

  res.json(updatedAcl);
});

const deleteAcl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const aclId = parseInt(id, 10);

  if (isNaN(aclId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await Acl.delete(aclId);

  if (!deleted) {
    return res.status(404).json({ message: 'Acl not found' });
  }

  res.status(204).send();
});

module.exports = {
  getAcl,
  getAclById,
  createAcl,
  updateAcl,
  deleteAcl,
};
