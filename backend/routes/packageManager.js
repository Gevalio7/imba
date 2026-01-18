const express = require('express');
const router = express.Router();
const {
  getPackageManager,
  getPackageManagerById,
  createPackageManager,
  updatePackageManager,
  deletePackageManager,
} = require('../controllers/packageManagerController');

// GET /packageManager - список с query params
router.get('/', getPackageManager);

// GET /packageManager/:id
router.get('/:id', getPackageManagerById);

// POST /packageManager
router.post('/', createPackageManager);

// PUT /packageManager/:id
router.put('/:id', updatePackageManager);

// DELETE /packageManager/:id
router.delete('/:id', deletePackageManager);

module.exports = router;
