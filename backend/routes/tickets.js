const express = require('express');
const router = express.Router();
const {
  getTickets,
  getTicketById,
  getTicketActions,
  createTicket,
  updateTicket,
  changeTicketStatus,
  deleteTicket,
} = require('../controllers/ticketsController');

// GET /tickets - список с query params
router.get('/', getTickets);

// GET /tickets/:id/actions - получить доступные действия для тикета
router.get('/:id/actions', getTicketActions);

// GET /tickets/:id
router.get('/:id', getTicketById);

// POST /tickets
router.post('/', createTicket);

// POST /tickets/:id/change-status - сменить статус с валидацией
router.post('/:id/change-status', changeTicketStatus);

// PUT /tickets/:id
router.put('/:id', updateTicket);

// DELETE /tickets/:id
router.delete('/:id', deleteTicket);

module.exports = router;
