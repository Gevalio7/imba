const express = require('express');
const router = express.Router();
const {
  getSystemLog,
  getSystemLogById,
  createSystemLog,
  updateSystemLog,
  deleteSystemLog,
} = require('../controllers/systemLogController');

// GET /systemLog - список с query params
router.get('/', getSystemLog);

// GET /systemLog/:id
router.get('/:id', getSystemLogById);

// POST /systemLog
router.post('/', createSystemLog);

// PUT /systemLog/:id
router.put('/:id', updateSystemLog);

// DELETE /systemLog/:id
router.delete('/:id', deleteSystemLog);

module.exports = router;
