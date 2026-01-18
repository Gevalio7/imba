const PostMasterMailAccounts = require('../models/postMasterMailAccounts');
const { asyncHandler } = require('../middleware/errorHandler');

const getPostMasterMailAccounts = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await PostMasterMailAccounts.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getPostMasterMailAccountById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const postmastermailaccountId = parseInt(id, 10);

  if (isNaN(postmastermailaccountId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const postmastermailaccount = await PostMasterMailAccounts.getById(postmastermailaccountId);

  if (!postmastermailaccount) {
    return res.status(404).json({ message: 'PostMasterMailAccount not found' });
  }

  res.json(postmastermailaccount);
});

const createPostMasterMailAccounts = asyncHandler(async (req, res) => {
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

  const newPostMasterMailAccount = await PostMasterMailAccounts.create(data);

  res.status(201).json(newPostMasterMailAccount);
});

const updatePostMasterMailAccounts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const postmastermailaccountId = parseInt(id, 10);

  if (isNaN(postmastermailaccountId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedPostMasterMailAccount = await PostMasterMailAccounts.update(postmastermailaccountId, data);

  if (!updatedPostMasterMailAccount) {
    return res.status(404).json({ message: 'PostMasterMailAccount not found' });
  }

  res.json(updatedPostMasterMailAccount);
});

const deletePostMasterMailAccounts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const postmastermailaccountId = parseInt(id, 10);

  if (isNaN(postmastermailaccountId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await PostMasterMailAccounts.delete(postmastermailaccountId);

  if (!deleted) {
    return res.status(404).json({ message: 'PostMasterMailAccount not found' });
  }

  res.status(204).send();
});

module.exports = {
  getPostMasterMailAccounts,
  getPostMasterMailAccountById,
  createPostMasterMailAccounts,
  updatePostMasterMailAccounts,
  deletePostMasterMailAccounts,
};
