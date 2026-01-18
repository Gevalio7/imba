const express = require('express');
const router = express.Router();
const {
  getCustomerUsersCustomers,
  getCustomerUsersCustomerById,
  createCustomerUsersCustomers,
  updateCustomerUsersCustomers,
  deleteCustomerUsersCustomers,
} = require('../controllers/customerUsersCustomersController');

// GET /customerUsersCustomers - список с query params
router.get('/', getCustomerUsersCustomers);

// GET /customerUsersCustomers/:id
router.get('/:id', getCustomerUsersCustomerById);

// POST /customerUsersCustomers
router.post('/', createCustomerUsersCustomers);

// PUT /customerUsersCustomers/:id
router.put('/:id', updateCustomerUsersCustomers);

// DELETE /customerUsersCustomers/:id
router.delete('/:id', deleteCustomerUsersCustomers);

module.exports = router;
