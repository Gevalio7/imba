const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
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
router.post('/', protect, checkPermission('menu_companies_list_write'), createCustomers);

// POST /customers/:id/services/:serviceId - добавить сервис к компании
router.post('/:id/services/:serviceId', protect, checkPermission('menu_companies_list_write'), addCustomerService);

// PUT /customers/:id
router.put('/:id', protect, checkPermission('menu_companies_list_write'), updateCustomers);

// DELETE /customers/:id
router.delete('/:id', protect, checkPermission('menu_companies_list_delete'), deleteCustomers);

// DELETE /customers/:id/services/:serviceId - удалить сервис от компании
router.delete('/:id/services/:serviceId', protect, removeCustomerService);

module.exports = router;
