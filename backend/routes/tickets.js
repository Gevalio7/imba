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

// Импорт middleware проверки разрешений и аутентификации
// const { checkPermission } = require('../middleware/permissions');
// const { protect } = require('../middleware/auth');

// GET /tickets - получить все тикеты (с фильтрацией по разрешениям)
router.get('/', getTickets);

// GET /tickets/:id/actions - получить доступные действия для тикета
router.get('/:id/actions', getTicketActions);

// GET /tickets/:id - получить тикет по ID
router.get('/:id', getTicketById);

// POST /tickets - создать тикет (требуется menu_tickets_create_write)
router.post('/', /* protect, checkPermission('menu_tickets_create_write'), */ createTicket);

// POST /tickets/:id/change-status - сменить статус (требуется menu_tickets_list_write)
router.post('/:id/change-status', /* protect, checkPermission('menu_tickets_list_write'), */ changeTicketStatus);

// PUT /tickets/:id - обновить тикет (требуется menu_tickets_list_write)
router.put('/:id', /* protect, checkPermission('menu_tickets_list_write'), */ updateTicket);

// DELETE /tickets/:id - удалить тикет (требуется menu_tickets_list_delete)
router.delete('/:id', /* protect, checkPermission('menu_tickets_list_delete'), */ deleteTicket);

module.exports = router;
