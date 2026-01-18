const express = require('express');
const router = express.Router();
const {
  getSupportDataCollector,
  getSupportDataCollectorById,
  createSupportDataCollector,
  updateSupportDataCollector,
  deleteSupportDataCollector,
} = require('../controllers/supportDataCollectorController');

// GET /supportDataCollector - список с query params
router.get('/', getSupportDataCollector);

// GET /supportDataCollector/:id
router.get('/:id', getSupportDataCollectorById);

// POST /supportDataCollector
router.post('/', createSupportDataCollector);

// PUT /supportDataCollector/:id
router.put('/:id', updateSupportDataCollector);

// DELETE /supportDataCollector/:id
router.delete('/:id', deleteSupportDataCollector);

module.exports = router;
