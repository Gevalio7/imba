const Tickets = require('../models/tickets');
const { asyncHandler } = require('../middleware/errorHandler');

const getTickets = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Tickets.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getTicketById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticketId = parseInt(id, 10);

  if (isNaN(ticketId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const ticket = await Tickets.getById(ticketId);

  if (!ticket) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  res.json(ticket);
});

const createTicket = asyncHandler(async (req, res) => {
  const data = {};
  
  // Generate ticket number if not provided
  if (!req.body.ticketNumber) {
    data.ticketNumber = await Tickets.generateTicketNumber();
  } else {
    data.ticketNumber = req.body.ticketNumber;
  }
  
  data.title = req.body.title;
  data.description = req.body.description || null;
  data.typeId = req.body.typeId || null;
  data.priorityId = req.body.priorityId || null;
  data.queueId = req.body.queueId || null;
  data.stateId = req.body.stateId || null;
  data.ownerId = req.body.ownerId || null;
  data.companyId = req.body.companyId || null;
  data.slaId = req.body.slaId || null;
  
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.title) {
    return res.status(400).json({ message: 'title is required' });
  }

  const newTicket = await Tickets.create(data);

  res.status(201).json(newTicket);
});

const updateTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticketId = parseInt(id, 10);

  if (isNaN(ticketId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.ticketNumber !== undefined) data.ticketNumber = req.body.ticketNumber;
  if (req.body.title !== undefined) data.title = req.body.title;
  if (req.body.description !== undefined) data.description = req.body.description;
  if (req.body.typeId !== undefined) data.typeId = req.body.typeId;
  if (req.body.priorityId !== undefined) data.priorityId = req.body.priorityId;
  if (req.body.queueId !== undefined) data.queueId = req.body.queueId;
  if (req.body.stateId !== undefined) data.stateId = req.body.stateId;
  if (req.body.ownerId !== undefined) data.ownerId = req.body.ownerId;
  if (req.body.companyId !== undefined) data.companyId = req.body.companyId;
  if (req.body.slaId !== undefined) data.slaId = req.body.slaId;
  
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedTicket = await Tickets.update(ticketId, data);

  if (!updatedTicket) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  res.json(updatedTicket);
});

const deleteTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticketId = parseInt(id, 10);

  if (isNaN(ticketId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await Tickets.delete(ticketId);

  if (!deleted) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  res.status(204).send();
});

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
};
