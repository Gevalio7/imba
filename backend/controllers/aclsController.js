const Acls = require('../models/acls');
const { asyncHandler } = require('../middleware/errorHandler');

const getAcls = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Acls.getAll({
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

  const acl = await Acls.getById(aclId);

  if (!acl) {
    return res.status(404).json({ message: 'Acl not found' });
  }

  res.json(acl);
});

const createAcls = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.description = req.body.description;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newAcl = await Acls.create(data);

  res.status(201).json(newAcl);
});

const updateAcls = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const aclId = parseInt(id, 10);

  if (isNaN(aclId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.description !== undefined) data.description = req.body.description;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedAcl = await Acls.update(aclId, data);

  if (!updatedAcl) {
    return res.status(404).json({ message: 'Acl not found' });
  }

  res.json(updatedAcl);
});

const deleteAcls = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const aclId = parseInt(id, 10);

  if (isNaN(aclId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await Acls.delete(aclId);

  if (!deleted) {
    return res.status(404).json({ message: 'Acl not found' });
  }

  res.status(204).send();
});

module.exports = {
  getAcls,
  getAclById,
  createAcls,
  updateAcls,
  deleteAcls,
};
