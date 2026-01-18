const express = require('express');
const router = express.Router();
const {
  getCustomerUsers,
  getCustomerUserById,
  createCustomerUsers,
  updateCustomerUsers,
  deleteCustomerUsers,
} = require('../controllers/customerUsersController');

// GET /customerUsers - список с query params
router.get('/', getCustomerUsers);

// GET /customerUsers/:id
router.get('/:id', getCustomerUserById);

// POST /customerUsers
router.post('/', createCustomerUsers);

// PUT /customerUsers/:id
router.put('/:id', updateCustomerUsers);

// DELETE /customerUsers/:id
router.delete('/:id', deleteCustomerUsers);

module.exports = router;
