const express = require('express');
const router = express.Router();
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
router.post('/', createQueues);

// PUT /queues/:id
router.put('/:id', updateQueues);

// DELETE /queues/:id
router.delete('/:id', deleteQueues);

module.exports = router;
