const express = require('express');
const router = express.Router();
const {
  getQueueAutoResponse,
  getQueueAutoResponseById,
  createQueueAutoResponse,
  updateQueueAutoResponse,
  deleteQueueAutoResponse,
} = require('../controllers/queueAutoResponseController');

// GET /queueAutoResponse - список с query params
router.get('/', getQueueAutoResponse);

// GET /queueAutoResponse/:id
router.get('/:id', getQueueAutoResponseById);

// POST /queueAutoResponse
router.post('/', createQueueAutoResponse);

// PUT /queueAutoResponse/:id
router.put('/:id', updateQueueAutoResponse);

// DELETE /queueAutoResponse/:id
router.delete('/:id', deleteQueueAutoResponse);

module.exports = router;
