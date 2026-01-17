const Acl = require('../models/acl');

const getAcl = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getAcl:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAclById = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getAclById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createAcl = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newAcl = await Acl.create({ name, description, status, isActive });

    res.status(201).json(newAcl);
  } catch (error) {
    console.error('Error in createAcl:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateAcl = async (req, res) => {
  try {
    const { id } = req.params;
    const aclId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(aclId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedAcl = await Acl.update(aclId, { name, description, status, isActive });

    if (!updatedAcl) {
      return res.status(404).json({ message: 'Acl not found' });
    }

    res.json(updatedAcl);
  } catch (error) {
    console.error('Error in updateAcl:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteAcl = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in deleteAcl:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAcl,
  getAclById,
  createAcl,
  updateAcl,
  deleteAcl,
};
