const TestEntities = require('../models/testEntities');

const getTestEntities = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await TestEntities.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getTestEntities:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getTestEntityById = async (req, res) => {
  try {
    const { id } = req.params;
    const testentityId = parseInt(id, 10);

    if (isNaN(testentityId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const testentity = await TestEntities.getById(testentityId);

    if (!testentity) {
      return res.status(404).json({ message: 'TestEntity not found' });
    }

    res.json(testentity);
  } catch (error) {
    console.error('Error in getTestEntityById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createTestEntities = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.comment = req.body.comment;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newTestEntity = await TestEntities.create(data);

    res.status(201).json(newTestEntity);
  } catch (error) {
    console.error('Error in createTestEntities:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateTestEntities = async (req, res) => {
  try {
    const { id } = req.params;
    const testentityId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.comment = req.body.comment;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(testentityId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedTestEntity = await TestEntities.update(testentityId, data);

    if (!updatedTestEntity) {
      return res.status(404).json({ message: 'TestEntity not found' });
    }

    res.json(updatedTestEntity);
  } catch (error) {
    console.error('Error in updateTestEntities:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteTestEntities = async (req, res) => {
  try {
    const { id } = req.params;
    const testentityId = parseInt(id, 10);

    if (isNaN(testentityId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await TestEntities.delete(testentityId);

    if (!deleted) {
      return res.status(404).json({ message: 'TestEntity not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteTestEntities:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getTestEntities,
  getTestEntityById,
  createTestEntities,
  updateTestEntities,
  deleteTestEntities,
};
