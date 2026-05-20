const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')
const { checkPermission } = require('../middleware/permissions')
const ticketSchedulesController = require('../controllers/ticketSchedulesController')

// Маршруты для расписаний тикетов
router.get('/', ticketSchedulesController.getAll)
router.get('/ticket/:ticketId', ticketSchedulesController.getByTicketId)
router.get('/:id', ticketSchedulesController.getById)
router.get('/:id/logs', ticketSchedulesController.getLogs)

// Создание/изменение/удаление расписаний требуют прав на расписания
router.post('/', protect, checkPermission('menu_tickets_schedules_write'), ticketSchedulesController.create)
router.put('/:id', protect, checkPermission('menu_tickets_schedules_write'), ticketSchedulesController.update)
router.delete('/:id', protect, checkPermission('menu_tickets_schedules_delete'), ticketSchedulesController.delete)
router.delete('/ticket/:ticketId', protect, checkPermission('menu_tickets_schedules_delete'), ticketSchedulesController.deleteByTicketId)

// Запуск расписания (создание тикета) — требуем write
router.post('/:id/run', protect, checkPermission('menu_tickets_schedules_write'), ticketSchedulesController.runSchedule)

module.exports = router
