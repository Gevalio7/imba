const express = require('express');
const router = express.Router();
const {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
} = require('../controllers/ticketsController');

// GET /tickets - список с query params
router.get('/', getTickets);

// GET /tickets/:id
router.get('/:id', getTicketById);

// POST /tickets
router.post('/', createTicket);

// PUT /tickets/:id
router.put('/:id', updateTicket);

// DELETE /tickets/:id
router.delete('/:id', deleteTicket);

module.exports = router;
