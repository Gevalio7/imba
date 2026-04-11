const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
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
router.post('/', protect, createCustomersGroups);

// PUT /customersGroups/:id
router.put('/:id', protect, updateCustomersGroups);

// DELETE /customersGroups/:id
router.delete('/:id', protect, deleteCustomersGroups);

module.exports = router;
