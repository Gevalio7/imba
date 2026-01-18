const express = require('express');
const router = express.Router();
const {
  getPerformanceLog,
  getPerformanceLogById,
  createPerformanceLog,
  updatePerformanceLog,
  deletePerformanceLog,
} = require('../controllers/performanceLogController');

// GET /performanceLog - список с query params
router.get('/', getPerformanceLog);

// GET /performanceLog/:id
router.get('/:id', getPerformanceLogById);

// POST /performanceLog
router.post('/', createPerformanceLog);

// PUT /performanceLog/:id
router.put('/:id', updatePerformanceLog);

// DELETE /performanceLog/:id
router.delete('/:id', deletePerformanceLog);

module.exports = router;
