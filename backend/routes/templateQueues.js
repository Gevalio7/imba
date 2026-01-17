const express = require('express');
const router = express.Router();
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
router.post('/', createTemplateQueues);

// PUT /templateQueues/:id
router.put('/:id', updateTemplateQueues);

// DELETE /templateQueues/:id
router.delete('/:id', deleteTemplateQueues);

module.exports = router;
