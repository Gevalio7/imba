const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
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
router.post('/', protect, checkPermission('menu_template_queues_write'), createTemplateQueues);

// PUT /templateQueues/:id
router.put('/:id', protect, checkPermission('menu_template_queues_write'), updateTemplateQueues);

// DELETE /templateQueues/:id
router.delete('/:id', protect, checkPermission('menu_template_queues_delete'), deleteTemplateQueues);

module.exports = router;
