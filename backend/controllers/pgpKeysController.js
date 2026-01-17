const PgpKeys = require('../models/pgpKeys');

const getPgpKeys = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await PgpKeys.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getPgpKeys:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getPgpKeyById = async (req, res) => {
  try {
    const { id } = req.params;
    const pgpkeyId = parseInt(id, 10);

    if (isNaN(pgpkeyId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const pgpkey = await PgpKeys.getById(pgpkeyId);

    if (!pgpkey) {
      return res.status(404).json({ message: 'PgpKey not found' });
    }

    res.json(pgpkey);
  } catch (error) {
    console.error('Error in getPgpKeyById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createPgpKeys = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newPgpKey = await PgpKeys.create({ name, description, status, isActive });

    res.status(201).json(newPgpKey);
  } catch (error) {
    console.error('Error in createPgpKeys:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updatePgpKeys = async (req, res) => {
  try {
    const { id } = req.params;
    const pgpkeyId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(pgpkeyId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedPgpKey = await PgpKeys.update(pgpkeyId, { name, description, status, isActive });

    if (!updatedPgpKey) {
      return res.status(404).json({ message: 'PgpKey not found' });
    }

    res.json(updatedPgpKey);
  } catch (error) {
    console.error('Error in updatePgpKeys:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deletePgpKeys = async (req, res) => {
  try {
    const { id } = req.params;
    const pgpkeyId = parseInt(id, 10);

    if (isNaN(pgpkeyId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await PgpKeys.delete(pgpkeyId);

    if (!deleted) {
      return res.status(404).json({ message: 'PgpKey not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deletePgpKeys:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getPgpKeys,
  getPgpKeyById,
  createPgpKeys,
  updatePgpKeys,
  deletePgpKeys,
};
