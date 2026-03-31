const express = require('express');
const router = express.Router();
const ticketSchedulesController = require('../controllers/ticketSchedulesController');

// Маршруты для расписаний тикетов
router.get('/', ticketSchedulesController.getAll);
router.get('/ticket/:ticketId', ticketSchedulesController.getByTicketId);
router.get('/:id', ticketSchedulesController.getById);
router.post('/', ticketSchedulesController.create);
router.put('/:id', ticketSchedulesController.update);
router.delete('/:id', ticketSchedulesController.delete);
router.delete('/ticket/:ticketId', ticketSchedulesController.deleteByTicketId);
router.post('/:id/run', ticketSchedulesController.runSchedule);

module.exports = router;
