const express = require('express');
const router = express.Router();
const {
  getTicketNotifications,
  getTicketNotificationById,
  createTicketNotifications,
  updateTicketNotifications,
  deleteTicketNotifications,
} = require('../controllers/ticketNotificationsController');

// GET /ticketNotifications - список с query params
router.get('/', getTicketNotifications);

// GET /ticketNotifications/:id
router.get('/:id', getTicketNotificationById);

// POST /ticketNotifications
router.post('/', createTicketNotifications);

// PUT /ticketNotifications/:id
router.put('/:id', updateTicketNotifications);

// DELETE /ticketNotifications/:id
router.delete('/:id', deleteTicketNotifications);

module.exports = router;
