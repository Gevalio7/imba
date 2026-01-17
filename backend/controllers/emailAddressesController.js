const EmailAddresses = require('../models/emailAddresses');

const getEmailAddresses = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await EmailAddresses.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getEmailAddresses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getEmailAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const emailaddressId = parseInt(id, 10);

    if (isNaN(emailaddressId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const emailaddress = await EmailAddresses.getById(emailaddressId);

    if (!emailaddress) {
      return res.status(404).json({ message: 'EmailAddress not found' });
    }

    res.json(emailaddress);
  } catch (error) {
    console.error('Error in getEmailAddressById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createEmailAddresses = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newEmailAddress = await EmailAddresses.create({ name, description, status, isActive });

    res.status(201).json(newEmailAddress);
  } catch (error) {
    console.error('Error in createEmailAddresses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateEmailAddresses = async (req, res) => {
  try {
    const { id } = req.params;
    const emailaddressId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(emailaddressId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedEmailAddress = await EmailAddresses.update(emailaddressId, { name, description, status, isActive });

    if (!updatedEmailAddress) {
      return res.status(404).json({ message: 'EmailAddress not found' });
    }

    res.json(updatedEmailAddress);
  } catch (error) {
    console.error('Error in updateEmailAddresses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteEmailAddresses = async (req, res) => {
  try {
    const { id } = req.params;
    const emailaddressId = parseInt(id, 10);

    if (isNaN(emailaddressId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await EmailAddresses.delete(emailaddressId);

    if (!deleted) {
      return res.status(404).json({ message: 'EmailAddress not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteEmailAddresses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getEmailAddresses,
  getEmailAddressById,
  createEmailAddresses,
  updateEmailAddresses,
  deleteEmailAddresses,
};
