const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  createServices,
  updateServices,
  deleteServices,
} = require('../controllers/servicesController');

// GET /services - список с query params
router.get('/', getServices);

// GET /services/:id
router.get('/:id', getServiceById);

// POST /services
router.post('/', createServices);

// PUT /services/:id
router.put('/:id', updateServices);

// DELETE /services/:id
router.delete('/:id', deleteServices);

module.exports = router;
