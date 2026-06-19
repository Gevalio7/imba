const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')
const { checkPermission } = require('../middleware/permissions')

const {
  sendNotification,
  logDelivery,
  processQueue,
  getQueue,
  getQueueStats,
  getLogs,
} = require('../controllers/notificationController')

// POST /notifications/send - поставить уведомление в очередь
router.post('/send', protect, sendNotification)

// POST /notifications/process-queue - ручной запуск отправки очереди
router.post('/process-queue', protect, processQueue)

// GET /notifications/queue - список очереди
router.get('/queue', protect, checkPermission('menu_templates_read'), getQueue)

// GET /notifications/queue/stats - статистика очереди
router.get('/queue/stats', protect, checkPermission('menu_templates_read'), getQueueStats)

// POST /notifications/log - записать лог
router.post('/log', protect, logDelivery)

// GET /notifications/logs - получить логи
router.get('/logs', protect, checkPermission('menu_templates_read'), getLogs)

module.exports = router
