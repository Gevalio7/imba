const Signatures = require('../models/signatures');
const { asyncHandler } = require('../middleware/errorHandler');

const getSignatures = asyncHandler(async (req, res) => {
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
});

const getSignatureById = asyncHandler(async (req, res) => {
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
});

const createSignatures = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.content = req.body.content;
  data.comment = req.body.comment;

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newSignature = await Signatures.create(data);

  res.status(201).json(newSignature);
});

const updateSignatures = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const signatureId = parseInt(id, 10);

  if (isNaN(signatureId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.content !== undefined) data.content = req.body.content;
  if (req.body.comment !== undefined) data.comment = req.body.comment;

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedSignature = await Signatures.update(signatureId, data);

  if (!updatedSignature) {
    return res.status(404).json({ message: 'Signature not found' });
  }

  res.json(updatedSignature);
});

const deleteSignatures = asyncHandler(async (req, res) => {
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
});

module.exports = {
  getSignatures,
  getSignatureById,
  createSignatures,
  updateSignatures,
  deleteSignatures,
};
