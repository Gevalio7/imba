const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTemplateQueues,
  getTemplateQueueById,
  createTemplateQueues,
  updateTemplateQueues,
  deleteTemplateQueues,
} = require('../controllers/templateQueuesController');

// GET /templateQueues - список с query params
router.get('/', getTemplateQueues);

// GET /templateQueues/:id
router.get('/:id', getTemplateQueueById);

// POST /templateQueues
router.post('/', protect, createTemplateQueues);

// PUT /templateQueues/:id
router.put('/:id', protect, updateTemplateQueues);

// DELETE /templateQueues/:id
router.delete('/:id', protect, deleteTemplateQueues);

module.exports = router;
