const express = require('express');
const router = express.Router();
const {
  getCustomersGroups,
  getCustomersGroupById,
  createCustomersGroups,
  updateCustomersGroups,
  deleteCustomersGroups,
} = require('../controllers/customersGroupsController');

// GET /customersGroups - список с query params
router.get('/', getCustomersGroups);

// GET /customersGroups/:id
router.get('/:id', getCustomersGroupById);

// POST /customersGroups
router.post('/', createCustomersGroups);

// PUT /customersGroups/:id
router.put('/:id', updateCustomersGroups);

// DELETE /customersGroups/:id
router.delete('/:id', deleteCustomersGroups);

module.exports = router;
