const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ticketSchedulesController = require('../controllers/ticketSchedulesController');

// Маршруты для расписаний тикетов
router.get('/', ticketSchedulesController.getAll);
router.get('/ticket/:ticketId', ticketSchedulesController.getByTicketId);
router.get('/:id', ticketSchedulesController.getById);
router.get('/:id/logs', ticketSchedulesController.getLogs);
router.post('/', protect, ticketSchedulesController.create);
router.put('/:id', protect, ticketSchedulesController.update);
router.delete('/:id', protect, ticketSchedulesController.delete);
router.delete('/ticket/:ticketId', protect, ticketSchedulesController.deleteByTicketId);
router.post('/:id/run', protect, ticketSchedulesController.runSchedule);

module.exports = router;
