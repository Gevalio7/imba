const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomers,
  updateCustomers,
  deleteCustomers,
  getCustomerServices,
  addCustomerService,
  removeCustomerService,
} = require('../controllers/customersController');

// GET /customers - список с query params
router.get('/', getCustomers);

// GET /customers/:id
router.get('/:id', getCustomerById);

// GET /customers/:id/services - получить сервисы компании
router.get('/:id/services', getCustomerServices);

// POST /customers
router.post('/', createCustomers);

// POST /customers/:id/services/:serviceId - добавить сервис к компании
router.post('/:id/services/:serviceId', addCustomerService);

// PUT /customers/:id
router.put('/:id', updateCustomers);

// DELETE /customers/:id
router.delete('/:id', deleteCustomers);

// DELETE /customers/:id/services/:serviceId - удалить сервис от компании
router.delete('/:id/services/:serviceId', removeCustomerService);

module.exports = router;
