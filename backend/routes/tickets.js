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

// Импорт middleware проверки разрешений
const { checkPermission } = require('../middleware/permissions');

// GET /tickets - получить все тикеты (с фильтрацией по разрешениям)
router.get('/', getTickets);

// GET /tickets/:id/actions - получить доступные действия для тикета
router.get('/:id/actions', getTicketActions);

// GET /tickets/:id - получить тикет по ID
router.get('/:id', getTicketById);

// POST /tickets - создать тикет (требуется разрешение create_ticket)
router.post('/', checkPermission('create_ticket'), createTicket);

// POST /tickets/:id/change-status - сменить статус (требуется change_status)
router.post('/:id/change-status', checkPermission('change_status'), changeTicketStatus);

// PUT /tickets/:id - обновить тикет (требуется reply_to_tickets)
router.put('/:id', checkPermission('reply_to_tickets'), updateTicket);

// DELETE /tickets/:id - удалить тикет (только для админов)
router.delete('/:id', deleteTicket);

module.exports = router;
