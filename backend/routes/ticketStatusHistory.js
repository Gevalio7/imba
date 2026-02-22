const express = require('express');
const router = express.Router();
const {
  getStatusHistory,
  getStatusStatistics,
} = require('../controllers/ticketStatusHistoryController');

// GET /api/ticketStatusHistory/:ticketId - История переходов статусов
router.get('/:ticketId', getStatusHistory);

// GET /api/ticketStatusHistory/:ticketId/statistics - Статистика по статусам
router.get('/:ticketId/statistics', getStatusStatistics);

module.exports = router;
