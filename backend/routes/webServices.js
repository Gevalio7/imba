const express = require('express');
const router = express.Router();
const {
  getWebServices,
  getWebServiceById,
  createWebServices,
  updateWebServices,
  deleteWebServices,
} = require('../controllers/webServicesController');

// GET /webServices - список с query params
router.get('/', getWebServices);

// GET /webServices/:id
router.get('/:id', getWebServiceById);

// POST /webServices
router.post('/', createWebServices);

// PUT /webServices/:id
router.put('/:id', updateWebServices);

// DELETE /webServices/:id
router.delete('/:id', deleteWebServices);

module.exports = router;
