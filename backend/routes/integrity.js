const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getIntegrityStatus,
  initializeHashes,
  getHashesList,
  resetHashes
} = require('../controllers/integrityController');

// GET /integrity - получить статус целостности
router.get('/', getIntegrityStatus);

// POST /integrity/initialize - инициализировать хэши
router.post('/initialize', protect, initializeHashes);

// GET /integrity/hashes - получить список хэшей
router.get('/hashes', getHashesList);

// POST /integrity/reset - сбросить хэши
router.post('/reset', protect, resetHashes);

module.exports = router;
