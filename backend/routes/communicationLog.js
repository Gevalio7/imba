const express = require('express');
const router = express.Router();
const {
  getCommunicationLog,
  getCommunicationLogById,
  createCommunicationLog,
  updateCommunicationLog,
  deleteCommunicationLog,
} = require('../controllers/communicationLogController');

// GET /communicationLog - список с query params
router.get('/', getCommunicationLog);

// GET /communicationLog/:id
router.get('/:id', getCommunicationLogById);

// POST /communicationLog
router.post('/', createCommunicationLog);

// PUT /communicationLog/:id
router.put('/:id', updateCommunicationLog);

// DELETE /communicationLog/:id
router.delete('/:id', deleteCommunicationLog);

module.exports = router;
