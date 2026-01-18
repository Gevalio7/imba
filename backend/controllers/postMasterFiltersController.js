const PostMasterFilters = require('../models/postMasterFilters');
const { asyncHandler } = require('../middleware/errorHandler');

const getPostMasterFilters = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await PostMasterFilters.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getPostMasterFilterById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const postmasterfilterId = parseInt(id, 10);

  if (isNaN(postmasterfilterId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const postmasterfilter = await PostMasterFilters.getById(postmasterfilterId);

  if (!postmasterfilter) {
    return res.status(404).json({ message: 'PostMasterFilter not found' });
  }

  res.json(postmasterfilter);
});

const createPostMasterFilters = asyncHandler(async (req, res) => {
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

  const newPostMasterFilter = await PostMasterFilters.create(data);

  res.status(201).json(newPostMasterFilter);
});

const updatePostMasterFilters = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const postmasterfilterId = parseInt(id, 10);

  if (isNaN(postmasterfilterId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedPostMasterFilter = await PostMasterFilters.update(postmasterfilterId, data);

  if (!updatedPostMasterFilter) {
    return res.status(404).json({ message: 'PostMasterFilter not found' });
  }

  res.json(updatedPostMasterFilter);
});

const deletePostMasterFilters = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const postmasterfilterId = parseInt(id, 10);

  if (isNaN(postmasterfilterId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await PostMasterFilters.delete(postmasterfilterId);

  if (!deleted) {
    return res.status(404).json({ message: 'PostMasterFilter not found' });
  }

  res.status(204).send();
});

module.exports = {
  getPostMasterFilters,
  getPostMasterFilterById,
  createPostMasterFilters,
  updatePostMasterFilters,
  deletePostMasterFilters,
};
