const express = require('express');
const router = express.Router();
const {
  getSystemFileSupport,
  getSystemFileSupportById,
  createSystemFileSupport,
  updateSystemFileSupport,
  deleteSystemFileSupport,
} = require('../controllers/systemFileSupportController');

// GET /systemFileSupport - список с query params
router.get('/', getSystemFileSupport);

// GET /systemFileSupport/:id
router.get('/:id', getSystemFileSupportById);

// POST /systemFileSupport
router.post('/', createSystemFileSupport);

// PUT /systemFileSupport/:id
router.put('/:id', updateSystemFileSupport);

// DELETE /systemFileSupport/:id
router.delete('/:id', deleteSystemFileSupport);

module.exports = router;
