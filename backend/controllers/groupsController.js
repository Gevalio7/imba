const Groups = require('../models/groups');

const getGroups = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await Groups.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const groupId = parseInt(id, 10);

    if (isNaN(groupId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const group = await Groups.getById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    console.error('Error in getGroupById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createGroups = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newGroup = await Groups.create({ name, description, status, isActive });

    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Error in createGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateGroups = async (req, res) => {
  try {
    const { id } = req.params;
    const groupId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(groupId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedGroup = await Groups.update(groupId, { name, description, status, isActive });

    if (!updatedGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json(updatedGroup);
  } catch (error) {
    console.error('Error in updateGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteGroups = async (req, res) => {
  try {
    const { id } = req.params;
    const groupId = parseInt(id, 10);

    if (isNaN(groupId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await Groups.delete(groupId);

    if (!deleted) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteGroups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getGroups,
  getGroupById,
  createGroups,
  updateGroups,
  deleteGroups,
};
