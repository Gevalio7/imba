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
  const postMasterMailAccountId = parseInt(id, 10);

  if (isNaN(postMasterMailAccountId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const postMasterMailAccount = await PostMasterMailAccounts.getById(postMasterMailAccountId);

  if (!postMasterMailAccount) {
    return res.status(404).json({ message: 'PostMasterMailAccount not found' });
  }

  res.json(postMasterMailAccount);
});

const createPostMasterMailAccount = asyncHandler(async (req, res) => {
  const data = {};
  
  // Обязательные поля
  data.type = req.body.type;
  data.authenticationType = req.body.authenticationType;
  data.login = req.body.login;
  data.host = req.body.host;
  
  // Опциональные поля
  if (req.body.password !== undefined) data.password = req.body.password;
  if (req.body.imapFolder !== undefined) data.imapFolder = req.body.imapFolder;
  if (req.body.trusted !== undefined) data.trusted = req.body.trusted;
  if (req.body.dispatchingBy !== undefined) data.dispatchingBy = req.body.dispatchingBy;
  if (req.body.queueId !== undefined) data.queueId = req.body.queueId;
  if (req.body.comment !== undefined) data.comment = req.body.comment;
  if (req.body.oauth2TokenConfigID !== undefined) data.oauth2TokenConfigID = req.body.oauth2TokenConfigID;
  if (req.body.isActive !== undefined) data.isActive = req.body.isActive;

  // Валидация обязательных полей
  if (!data.type) {
    return res.status(400).json({ message: 'type is required' });
  }
  if (!data.authenticationType) {
    return res.status(400).json({ message: 'authenticationType is required' });
  }
  if (!data.login) {
    return res.status(400).json({ message: 'login is required' });
  }
  if (!data.host) {
    return res.status(400).json({ message: 'host is required' });
  }

  // Для password - требуется если authenticationType = 'password'
  if (data.authenticationType === 'password' && !data.password) {
    return res.status(400).json({ message: 'password is required when authenticationType is password' });
  }

  const newPostMasterMailAccount = await PostMasterMailAccounts.create(data);

  res.status(201).json(newPostMasterMailAccount);
});

const updatePostMasterMailAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const postMasterMailAccountId = parseInt(id, 10);

  if (isNaN(postMasterMailAccountId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  
  // Опциональные поля
  if (req.body.type !== undefined) data.type = req.body.type;
  if (req.body.authenticationType !== undefined) data.authenticationType = req.body.authenticationType;
  if (req.body.login !== undefined) data.login = req.body.login;
  if (req.body.password !== undefined) data.password = req.body.password;
  if (req.body.host !== undefined) data.host = req.body.host;
  if (req.body.imapFolder !== undefined) data.imapFolder = req.body.imapFolder;
  if (req.body.trusted !== undefined) data.trusted = req.body.trusted;
  if (req.body.dispatchingBy !== undefined) data.dispatchingBy = req.body.dispatchingBy;
  if (req.body.queueId !== undefined) data.queueId = req.body.queueId;
  if (req.body.comment !== undefined) data.comment = req.body.comment;
  if (req.body.oauth2TokenConfigID !== undefined) data.oauth2TokenConfigID = req.body.oauth2TokenConfigID;
  if (req.body.isActive !== undefined) data.isActive = req.body.isActive;

  const updatedPostMasterMailAccount = await PostMasterMailAccounts.update(postMasterMailAccountId, data);

  if (!updatedPostMasterMailAccount) {
    return res.status(404).json({ message: 'PostMasterMailAccount not found' });
  }

  res.json(updatedPostMasterMailAccount);
});

const deletePostMasterMailAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const postMasterMailAccountId = parseInt(id, 10);

  if (isNaN(postMasterMailAccountId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await PostMasterMailAccounts.delete(postMasterMailAccountId);

  if (!deleted) {
    return res.status(404).json({ message: 'PostMasterMailAccount not found' });
  }

  res.status(204).send();
});

module.exports = {
  getPostMasterMailAccounts,
  getPostMasterMailAccountById,
  createPostMasterMailAccount,
  updatePostMasterMailAccount,
  deletePostMasterMailAccount,
};
