const express = require('express');
const router = express.Router();
const {
  getCustomerUsersGroups,
  getCustomerUsersGroupById,
  createCustomerUsersGroups,
  updateCustomerUsersGroups,
  deleteCustomerUsersGroups,
} = require('../controllers/customerUsersGroupsController');

// GET /customerUsersGroups - список с query params
router.get('/', getCustomerUsersGroups);

// GET /customerUsersGroups/:id
router.get('/:id', getCustomerUsersGroupById);

// POST /customerUsersGroups
router.post('/', createCustomerUsersGroups);

// PUT /customerUsersGroups/:id
router.put('/:id', updateCustomerUsersGroups);

// DELETE /customerUsersGroups/:id
router.delete('/:id', deleteCustomerUsersGroups);

module.exports = router;
