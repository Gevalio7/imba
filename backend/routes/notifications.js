const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')
const { checkPermission } = require('../middleware/permissions')

const {
  sendNotification,
  logDelivery,
  getLogs,
} = require('../controllers/notificationController')

// POST /notifications/send - отправить уведомление
router.post('/send', protect, sendNotification)

// POST /notifications/log - записать лог
router.post('/log', protect, logDelivery)

// GET /notifications/logs - получить логи
router.get('/logs', protect, checkPermission('menu_templates_read'), getLogs)

module.exports = router
