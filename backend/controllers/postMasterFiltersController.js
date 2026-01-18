const PostMasterFilters = require('../models/postMasterFilters');

const getPostMasterFilters = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getPostMasterFilters:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getPostMasterFilterById = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getPostMasterFilterById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createPostMasterFilters = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newPostMasterFilter = await PostMasterFilters.create(data);

    res.status(201).json(newPostMasterFilter);
  } catch (error) {
    console.error('Error in createPostMasterFilters:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updatePostMasterFilters = async (req, res) => {
  try {
    const { id } = req.params;
    const postmasterfilterId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(postmasterfilterId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedPostMasterFilter = await PostMasterFilters.update(postmasterfilterId, data);

    if (!updatedPostMasterFilter) {
      return res.status(404).json({ message: 'PostMasterFilter not found' });
    }

    res.json(updatedPostMasterFilter);
  } catch (error) {
    console.error('Error in updatePostMasterFilters:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deletePostMasterFilters = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in deletePostMasterFilters:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getPostMasterFilters,
  getPostMasterFilterById,
  createPostMasterFilters,
  updatePostMasterFilters,
  deletePostMasterFilters,
};
