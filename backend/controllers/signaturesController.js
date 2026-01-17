const Signatures = require('../models/signatures');

const getSignatures = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await Signatures.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getSignatures:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getSignatureById = async (req, res) => {
  try {
    const { id } = req.params;
    const signatureId = parseInt(id, 10);

    if (isNaN(signatureId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const signature = await Signatures.getById(signatureId);

    if (!signature) {
      return res.status(404).json({ message: 'Signature not found' });
    }

    res.json(signature);
  } catch (error) {
    console.error('Error in getSignatureById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createSignatures = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newSignature = await Signatures.create({ name, description, status, isActive });

    res.status(201).json(newSignature);
  } catch (error) {
    console.error('Error in createSignatures:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateSignatures = async (req, res) => {
  try {
    const { id } = req.params;
    const signatureId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(signatureId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedSignature = await Signatures.update(signatureId, { name, description, status, isActive });

    if (!updatedSignature) {
      return res.status(404).json({ message: 'Signature not found' });
    }

    res.json(updatedSignature);
  } catch (error) {
    console.error('Error in updateSignatures:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteSignatures = async (req, res) => {
  try {
    const { id } = req.params;
    const signatureId = parseInt(id, 10);

    if (isNaN(signatureId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await Signatures.delete(signatureId);

    if (!deleted) {
      return res.status(404).json({ message: 'Signature not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteSignatures:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getSignatures,
  getSignatureById,
  createSignatures,
  updateSignatures,
  deleteSignatures,
};
