const SqlBox = require('../models/sqlBox');

const getSqlBox = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await SqlBox.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getSqlBox:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getSqlBoxById = async (req, res) => {
  try {
    const { id } = req.params;
    const sqlboxId = parseInt(id, 10);

    if (isNaN(sqlboxId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const sqlbox = await SqlBox.getById(sqlboxId);

    if (!sqlbox) {
      return res.status(404).json({ message: 'SqlBox not found' });
    }

    res.json(sqlbox);
  } catch (error) {
    console.error('Error in getSqlBoxById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createSqlBox = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.message = req.body.message;
    data.status = req.body.status;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newSqlBox = await SqlBox.create(data);

    res.status(201).json(newSqlBox);
  } catch (error) {
    console.error('Error in createSqlBox:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateSqlBox = async (req, res) => {
  try {
    const { id } = req.params;
    const sqlboxId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.message = req.body.message;
    data.status = req.body.status;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(sqlboxId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedSqlBox = await SqlBox.update(sqlboxId, data);

    if (!updatedSqlBox) {
      return res.status(404).json({ message: 'SqlBox not found' });
    }

    res.json(updatedSqlBox);
  } catch (error) {
    console.error('Error in updateSqlBox:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteSqlBox = async (req, res) => {
  try {
    const { id } = req.params;
    const sqlboxId = parseInt(id, 10);

    if (isNaN(sqlboxId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await SqlBox.delete(sqlboxId);

    if (!deleted) {
      return res.status(404).json({ message: 'SqlBox not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteSqlBox:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getSqlBox,
  getSqlBoxById,
  createSqlBox,
  updateSqlBox,
  deleteSqlBox,
};
