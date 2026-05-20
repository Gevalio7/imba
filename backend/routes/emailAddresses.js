const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')

const {
  getEmailAddresses,
  getEmailAddressById,
  createEmailAddresses,
  updateEmailAddresses,
  deleteEmailAddresses,
} = require('../controllers/emailAddressesController')

// GET /emailAddresses - список с query params
router.get('/', getEmailAddresses)

// GET /emailAddresses/:id
router.get('/:id', getEmailAddressById)

// POST /emailAddresses
router.post('/', protect, createEmailAddresses)

// PUT /emailAddresses/:id
router.put('/:id', protect, updateEmailAddresses)

// DELETE /emailAddresses/:id
router.delete('/:id', protect, deleteEmailAddresses)

module.exports = router
