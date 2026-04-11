const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getQueues,
  getQueueById,
  createQueues,
  updateQueues,
  deleteQueues,
} = require('../controllers/queuesController');

// GET /queues - список с query params
router.get('/', getQueues);

// GET /queues/:id
router.get('/:id', getQueueById);

// POST /queues
router.post('/', protect, createQueues);

// PUT /queues/:id
router.put('/:id', protect, updateQueues);

// DELETE /queues/:id
router.delete('/:id', protect, deleteQueues);

module.exports = router;
