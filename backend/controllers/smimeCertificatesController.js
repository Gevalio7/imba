const SmimeCertificates = require('../models/smimeCertificates');

const getSmimeCertificates = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await SmimeCertificates.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getSmimeCertificates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getSmimeCertificateById = async (req, res) => {
  try {
    const { id } = req.params;
    const smimecertificateId = parseInt(id, 10);

    if (isNaN(smimecertificateId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const smimecertificate = await SmimeCertificates.getById(smimecertificateId);

    if (!smimecertificate) {
      return res.status(404).json({ message: 'SmimeCertificate not found' });
    }

    res.json(smimecertificate);
  } catch (error) {
    console.error('Error in getSmimeCertificateById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createSmimeCertificates = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newSmimeCertificate = await SmimeCertificates.create({ name, description, status, isActive });

    res.status(201).json(newSmimeCertificate);
  } catch (error) {
    console.error('Error in createSmimeCertificates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateSmimeCertificates = async (req, res) => {
  try {
    const { id } = req.params;
    const smimecertificateId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(smimecertificateId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedSmimeCertificate = await SmimeCertificates.update(smimecertificateId, { name, description, status, isActive });

    if (!updatedSmimeCertificate) {
      return res.status(404).json({ message: 'SmimeCertificate not found' });
    }

    res.json(updatedSmimeCertificate);
  } catch (error) {
    console.error('Error in updateSmimeCertificates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteSmimeCertificates = async (req, res) => {
  try {
    const { id } = req.params;
    const smimecertificateId = parseInt(id, 10);

    if (isNaN(smimecertificateId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await SmimeCertificates.delete(smimecertificateId);

    if (!deleted) {
      return res.status(404).json({ message: 'SmimeCertificate not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteSmimeCertificates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getSmimeCertificates,
  getSmimeCertificateById,
  createSmimeCertificates,
  updateSmimeCertificates,
  deleteSmimeCertificates,
};
