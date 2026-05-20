const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')
const { checkPermission } = require('../middleware/permissions')

const {
  getSignatures,
  getSignatureById,
  createSignatures,
  updateSignatures,
  deleteSignatures,
} = require('../controllers/signaturesController')

// GET /signatures - список с query params
router.get('/', getSignatures)

// GET /signatures/:id
router.get('/:id', getSignatureById)

// POST /signatures
router.post('/', protect, checkPermission('menu_signatures_write'), createSignatures)

// PUT /signatures/:id
router.put('/:id', protect, checkPermission('menu_signatures_write'), updateSignatures)

// DELETE /signatures/:id
router.delete('/:id', protect, checkPermission('menu_signatures_delete'), deleteSignatures)

module.exports = router
