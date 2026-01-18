const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomers,
  updateCustomers,
  deleteCustomers,
} = require('../controllers/customersController');

// GET /customers - список с query params
router.get('/', getCustomers);

// GET /customers/:id
router.get('/:id', getCustomerById);

// POST /customers
router.post('/', createCustomers);

// PUT /customers/:id
router.put('/:id', updateCustomers);

// DELETE /customers/:id
router.delete('/:id', deleteCustomers);

module.exports = router;
