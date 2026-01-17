const express = require('express');
const router = express.Router();
const {
  getTicketAttributeRelations,
  getTicketAttributeRelationById,
  createTicketAttributeRelations,
  updateTicketAttributeRelations,
  deleteTicketAttributeRelations,
} = require('../controllers/ticketAttributeRelationsController');

// GET /ticketAttributeRelations - список с query params
router.get('/', getTicketAttributeRelations);

// GET /ticketAttributeRelations/:id
router.get('/:id', getTicketAttributeRelationById);

// POST /ticketAttributeRelations
router.post('/', createTicketAttributeRelations);

// PUT /ticketAttributeRelations/:id
router.put('/:id', updateTicketAttributeRelations);

// DELETE /ticketAttributeRelations/:id
router.delete('/:id', deleteTicketAttributeRelations);

module.exports = router;
