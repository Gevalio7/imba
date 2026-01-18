const TicketAttributeRelations = require('../models/ticketAttributeRelations');
const { asyncHandler } = require('../middleware/errorHandler');

const getTicketAttributeRelations = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await TicketAttributeRelations.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getTicketAttributeRelationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticketattributerelationId = parseInt(id, 10);

  if (isNaN(ticketattributerelationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const ticketattributerelation = await TicketAttributeRelations.getById(ticketattributerelationId);

  if (!ticketattributerelation) {
    return res.status(404).json({ message: 'TicketAttributeRelation not found' });
  }

  res.json(ticketattributerelation);
});

const createTicketAttributeRelations = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.sourceAttribute = req.body.sourceAttribute;
  data.targetAttribute = req.body.targetAttribute;
  data.relationType = req.body.relationType;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newTicketAttributeRelation = await TicketAttributeRelations.create(data);

  res.status(201).json(newTicketAttributeRelation);
});

const updateTicketAttributeRelations = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticketattributerelationId = parseInt(id, 10);

  if (isNaN(ticketattributerelationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.sourceAttribute !== undefined) data.sourceAttribute = req.body.sourceAttribute;
  if (req.body.targetAttribute !== undefined) data.targetAttribute = req.body.targetAttribute;
  if (req.body.relationType !== undefined) data.relationType = req.body.relationType;
  
  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedTicketAttributeRelation = await TicketAttributeRelations.update(ticketattributerelationId, data);

  if (!updatedTicketAttributeRelation) {
    return res.status(404).json({ message: 'TicketAttributeRelation not found' });
  }

  res.json(updatedTicketAttributeRelation);
});

const deleteTicketAttributeRelations = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticketattributerelationId = parseInt(id, 10);

  if (isNaN(ticketattributerelationId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await TicketAttributeRelations.delete(ticketattributerelationId);

  if (!deleted) {
    return res.status(404).json({ message: 'TicketAttributeRelation not found' });
  }

  res.status(204).send();
});

module.exports = {
  getTicketAttributeRelations,
  getTicketAttributeRelationById,
  createTicketAttributeRelations,
  updateTicketAttributeRelations,
  deleteTicketAttributeRelations,
};
