const SmimeCertificates = require('../models/smimeCertificates');
const { asyncHandler } = require('../middleware/errorHandler');

const getSmimeCertificates = asyncHandler(async (req, res) => {
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
});

const getSmimeCertificateById = asyncHandler(async (req, res) => {
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
});

const createSmimeCertificates = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newSmimeCertificate = await SmimeCertificates.create(data);

  res.status(201).json(newSmimeCertificate);
});

const updateSmimeCertificates = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const smimecertificateId = parseInt(id, 10);

  if (isNaN(smimecertificateId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.message !== undefined) data.message = req.body.message;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedSmimeCertificate = await SmimeCertificates.update(smimecertificateId, data);

  if (!updatedSmimeCertificate) {
    return res.status(404).json({ message: 'SmimeCertificate not found' });
  }

  res.json(updatedSmimeCertificate);
});

const deleteSmimeCertificates = asyncHandler(async (req, res) => {
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
});

module.exports = {
  getSmimeCertificates,
  getSmimeCertificateById,
  createSmimeCertificates,
  updateSmimeCertificates,
  deleteSmimeCertificates,
};
