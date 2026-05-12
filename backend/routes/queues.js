const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
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
router.post('/', protect, checkPermission('menu_queues_write'), createQueues);

// PUT /queues/:id
router.put('/:id', protect, checkPermission('menu_queues_write'), updateQueues);

// DELETE /queues/:id
router.delete('/:id', protect, checkPermission('menu_queues_delete'), deleteQueues);

module.exports = router;
