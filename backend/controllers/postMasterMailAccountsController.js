const PostMasterMailAccounts = require('../models/postMasterMailAccounts');

const getPostMasterMailAccounts = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getPostMasterMailAccounts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getPostMasterMailAccountById = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getPostMasterMailAccountById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createPostMasterMailAccounts = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newPostMasterMailAccount = await PostMasterMailAccounts.create(data);

    res.status(201).json(newPostMasterMailAccount);
  } catch (error) {
    console.error('Error in createPostMasterMailAccounts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updatePostMasterMailAccounts = async (req, res) => {
  try {
    const { id } = req.params;
    const postmastermailaccountId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(postmastermailaccountId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedPostMasterMailAccount = await PostMasterMailAccounts.update(postmastermailaccountId, data);

    if (!updatedPostMasterMailAccount) {
      return res.status(404).json({ message: 'PostMasterMailAccount not found' });
    }

    res.json(updatedPostMasterMailAccount);
  } catch (error) {
    console.error('Error in updatePostMasterMailAccounts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deletePostMasterMailAccounts = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in deletePostMasterMailAccounts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getPostMasterMailAccounts,
  getPostMasterMailAccountById,
  createPostMasterMailAccounts,
  updatePostMasterMailAccounts,
  deletePostMasterMailAccounts,
};
