const TestEntity = require('../models/testEntity');

const getTestEntities = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await TestEntity.getAll({
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
    const entityId = parseInt(id, 10);

    if (isNaN(entityId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const entity = await TestEntity.getById(entityId);

    if (!entity) {
      return res.status(404).json({ message: 'Test Entity not found' });
    }

    res.json(entity);
  } catch (error) {
    console.error('Error in getTestEntityById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createTestEntity = async (req, res) => {
  try {
    const { name, comment } = req.body;

    if (!name || !comment) {
      return res.status(400).json({ message: 'Name and comment are required' });
    }

    const newEntity = await TestEntity.create({ name, comment });

    res.status(201).json(newEntity);
  } catch (error) {
    console.error('Error in createTestEntity:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateTestEntity = async (req, res) => {
  try {
    const { id } = req.params;
    const entityId = parseInt(id, 10);
    const { name, comment } = req.body;

    if (isNaN(entityId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name || !comment) {
      return res.status(400).json({ message: 'Name and comment are required' });
    }

    const updatedEntity = await TestEntity.update(entityId, { name, comment });

    if (!updatedEntity) {
      return res.status(404).json({ message: 'Test Entity not found' });
    }

    res.json(updatedEntity);
  } catch (error) {
    console.error('Error in updateTestEntity:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteTestEntity = async (req, res) => {
  try {
    const { id } = req.params;
    const entityId = parseInt(id, 10);

    if (isNaN(entityId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await TestEntity.delete(entityId);

    if (!deleted) {
      return res.status(404).json({ message: 'Test Entity not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteTestEntity:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getTestEntities,
  getTestEntityById,
  createTestEntity,
  updateTestEntity,
  deleteTestEntity,
};
