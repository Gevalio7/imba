const express = require('express');
const router = express.Router();
const {
  getCustomerUsersServices,
  getCustomerUsersServiceById,
  createCustomerUsersServices,
  updateCustomerUsersServices,
  deleteCustomerUsersServices,
} = require('../controllers/customerUsersServicesController');

// GET /customerUsersServices - список с query params
router.get('/', getCustomerUsersServices);

// GET /customerUsersServices/:id
router.get('/:id', getCustomerUsersServiceById);

// POST /customerUsersServices
router.post('/', createCustomerUsersServices);

// PUT /customerUsersServices/:id
router.put('/:id', updateCustomerUsersServices);

// DELETE /customerUsersServices/:id
router.delete('/:id', deleteCustomerUsersServices);

module.exports = router;
