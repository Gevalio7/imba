const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')

const {
  getCustomerUsers,
  getCustomerUserById,
  createCustomerUsers,
  updateCustomerUsers,
  deleteCustomerUsers,
} = require('../controllers/customerUsersController')

// GET /customerUsers - список с query params
router.get('/', getCustomerUsers)

// GET /customerUsers/:id
router.get('/:id', getCustomerUserById)

// POST /customerUsers
router.post('/', protect, createCustomerUsers)

// PUT /customerUsers/:id
router.put('/:id', protect, updateCustomerUsers)

// DELETE /customerUsers/:id
router.delete('/:id', protect, deleteCustomerUsers)

module.exports = router
