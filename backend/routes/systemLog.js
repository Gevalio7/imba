const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
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
router.post('/', protect, createSystemLog);

// PUT /systemLog/:id
router.put('/:id', protect, updateSystemLog);

// DELETE /systemLog/:id
router.delete('/:id', protect, deleteSystemLog);

module.exports = router;
