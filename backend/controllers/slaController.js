const Sla = require('../models/sla');
const { asyncHandler } = require('../middleware/errorHandler');

const getSla = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Sla.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getSlaById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const slaId = parseInt(id, 10);

  if (isNaN(slaId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const sla = await Sla.getById(slaId);

  if (!sla) {
    return res.status(404).json({ message: 'Sla not found' });
  }

  res.json(sla);
});

const createSla = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.description = req.body.description;
  data.responseTime = req.body.responseTime;
  data.resolutionTime = req.body.resolutionTime;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newSla = await Sla.create(data);

  res.status(201).json(newSla);
});

const updateSla = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const slaId = parseInt(id, 10);

  if (isNaN(slaId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.description !== undefined) data.description = req.body.description;
  if (req.body.responseTime !== undefined) data.responseTime = req.body.responseTime;
  if (req.body.resolutionTime !== undefined) data.resolutionTime = req.body.resolutionTime;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedSla = await Sla.update(slaId, data);

  if (!updatedSla) {
    return res.status(404).json({ message: 'Sla not found' });
  }

  res.json(updatedSla);
});

const deleteSla = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const slaId = parseInt(id, 10);

  if (isNaN(slaId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await Sla.delete(slaId);

  if (!deleted) {
    return res.status(404).json({ message: 'Sla not found' });
  }

  res.status(204).send();
});

module.exports = {
  getSla,
  getSlaById,
  createSla,
  updateSla,
  deleteSla,
};
